from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import io
import google.genai as genai
from google.genai.types import (
    GenerateContentConfig,
    GoogleSearch,
    HttpOptions,
    Tool,
)
from IPython.display import HTML, Markdown
from docx import Document as DocxDocument
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import tempfile
from typing import Optional
import matplotlib.pyplot as plt
import re
import ast

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MODEL_ID = "gemini-2.5-flash"
# Gemini API key (replace with your own)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "models/gemini-2.5-flash"
client = genai.Client(api_key=GEMINI_API_KEY)



class GenerateTemplateRequest(BaseModel):
    company_name: str
    task_or_domain: str

class RefineTemplateRequest(BaseModel):
    template: str
    refinement_option: str
    refinement_prompt: Optional[str] = None
    visualize_data: Optional[str] = None

class ExportTemplateRequest(BaseModel):
    template: str
    format: str  # 'pdf', 'docx', 'txt'
    company_name: str = ''
    task_or_domain: str = ''

@app.post("/generate-template")
def generate_template(req: GenerateTemplateRequest):
    prompt = f"""
    You are an expert consultant with access to a search tool. Use your search tool to gather 
    most recent real time updates, relevant, and accurate information for the following task.
    Create a consulting template for a company.
    Company Name: {req.company_name}
    Task/Domain: {req.task_or_domain}
    The template should include:
    1. Introduction
    2. Pitch Deck (with 3-5 bullet points)
    3. General Company Details (industry, size, etc.)
    Use your search tool to ensure all details are current and relevant and real time.
    At the end, include a 'References' section listing all sources/links used, formatted in Harvard referencing style.
    Format the response in markdown with clear section headers.
    """
    def gemini_stream():
        print("\n\n\n\n\n\n")
        for chunk in client.models.generate_content_stream(
            model=MODEL_NAME,
            contents=prompt,
            #stream=True,
            config=GenerateContentConfig(
                tools=[
                    # Use Google Search Tool
                    Tool(google_search=GoogleSearch())
                ],
            ),
        ):
            
            if hasattr(chunk, "text"):
                yield chunk.text.encode("utf-8")
                print("CHUNK:", chunk.text)
    return StreamingResponse(gemini_stream(), media_type="text/plain")

@app.post("/template")
def get_template(req: GenerateTemplateRequest):
    return generate_template(req)

@app.post("/refine-template")
def refine_template(req: RefineTemplateRequest):
    if req.refinement_option == 'Graph Visualization':
        # Use a specialized prompt for graph visualization
        prompt = f"""
        You are an expert consultant with access to a search tool. Use your search tool to gather up-to-date, relevant, and accurate information for the following refinement.
        Here is a consulting template:
        {req.template}
        
        Now you have to provide data for X axis and Y axis for the graph visulization in a dictionay of key value pairs and NOTHING ELSE:
        Visualization data for {req.visualize_data}:
        Use your search tool to ensure all details are current and relevant. 
        You have to provide data for atleast minimum 3 data points to maximum as much as you are able to find but make sure the data
        is relevant to the company and the task/domain only. The key should be the year and the value should be the data for that year 
        and the ear should be in ascending order only. The key and value both should be a number.
        It should be in the format of a dictionary of key value pairs. And 
        strictly the response should only be the dictionary of key value pairs and nothing else.
        """
        def gemini_stream():
            #for chunk in client.models.generate_content(MODEL_NAME,prompt,GenerateContentConfig(tools=[Tool(google_search=GoogleSearch())])):
            response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=prompt,
                    config=GenerateContentConfig(
                        tools=[
                            # Use Google Search Tool
                            Tool(google_search=GoogleSearch())
                        ],
                    ),
                )
            model_response = response.text
            print("MODEL RESPONSE:", model_response)
            data_dict = extract_dict_from_text(model_response)
            if data_dict:
                print("I m herer")
                return bar_graph_response(data_dict)
            else:
                raise HTTPException(status_code=500, detail="Failed to extract data for graph visualization.")
        
        return StreamingResponse(gemini_stream(), media_type="text/plain")
    else:
        prompt = f"""
        You are an expert consultant with access to a search tool. Use your search tool to gather up-to-date, relevant, and accurate information for the following refinement.
        Here is a consulting template:
        {req.template}
        
        Please {req.refinement_option.lower()} as follows:
        {req.refinement_prompt}
        Use your search tool to ensure all details are current and relevant.
        At the end, include a 'References' section listing all sources/links used, formatted in Harvard referencing style.
        Return the updated template in markdown.
        """
        def gemini_stream():
            #model = client.models.generate_content(MODEL_NAME,GenerateContentConfig[types.Tool(google_search={GoogleSearch()})])
            #for chunk in model.generate_content(prompt, stream=True):
            #for chunk in client.models.generate_content(MODEL_NAME,prompt,GenerateContentConfig(tools=[Tool(google_search=GoogleSearch())])):
            # response = client.models.generate_content(
            #         model=MODEL_NAME,
            #         contents=prompt,
            #         config=GenerateContentConfig(
            #             tools=[
            #                 # Use Google Search Tool
            #                 Tool(google_search=GoogleSearch())
            #             ],
            #         ),
            #     )
            for chunk in client.models.generate_content_stream(
                    model=MODEL_NAME,
                    contents=prompt,
                    config=GenerateContentConfig(
                        tools=[
                            # Use Google Search Tool
                            Tool(google_search=GoogleSearch())
                        ],
                    ),
                ):
                if hasattr(chunk, "text"):
                    yield chunk.text
                    print("CHUNK:", chunk.text)
        return StreamingResponse(gemini_stream(), media_type="text/plain")

@app.post("/export-template")
def export_template(req: ExportTemplateRequest):
    fmt = req.format.lower()
    content = req.template
    filename = f"consulting_template.{fmt}"
    import re
    html = markdown2.markdown(content, extras=["fenced-code-blocks", "tables", "strike", "cuddled-lists", "task_list"])
    if fmt == 'txt':
        # Convert markdown to plain text
        text = re.sub('<[^<]+?>', '', html)  # strip html tags
        buf = io.BytesIO(text.encode('utf-8'))
        return StreamingResponse(buf, media_type='text/plain', headers={
            'Content-Disposition': f'attachment; filename="{filename}"'
        })
    elif fmt == 'docx':
        try:
            import pypandoc
            pypandoc.ensure_pandoc_installed()
        except ImportError:
            raise HTTPException(status_code=500, detail='pypandoc is not installed')
        try:
            with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmpfile:
                pypandoc.convert_text(content, 'docx', format='md', outputfile=tmpfile.name)
                tmpfile.seek(0)
                docx_bytes = tmpfile.read()
            buf = io.BytesIO(docx_bytes)
            buf.seek(0)
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f'Pandoc is not installed or failed: {e}')
        return StreamingResponse(buf, media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document', headers={
            'Content-Disposition': f'attachment; filename="{filename}"'
        })
    elif fmt == 'pdf':
        from xhtml2pdf import pisa
        buf = io.BytesIO()
        pisa.CreatePDF(io.StringIO(html), dest=buf)
        buf.seek(0)
        return StreamingResponse(buf, media_type='application/pdf', headers={
            'Content-Disposition': f'attachment; filename="{filename}"'
        })
    else:
        raise HTTPException(status_code=400, detail='Unsupported export format') 

def bar_graph_response(data_dict):
    # Create a bar graph from the dictionary
    fig, ax = plt.subplots()
    x = list(data_dict.keys())
    y = list(data_dict.values())
    ax.bar(x, y, color='#1976d2')
    ax.set_xlabel('Year')
    ax.set_ylabel('Value')
    ax.set_title('Bar Graph Visualization')
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    #plt.bar(x, y, color = "red")
    plt.show()
    return StreamingResponse(buf, media_type='image/png') 

def extract_dict_from_text(model_response):
    # Regex to find a dictionary in the text
    match = re.search(r'\{[^}]+\}', model_response, re.DOTALL)
    if match:
        dict_str = match.group(0)
        try:
            data_dict = ast.literal_eval(dict_str)
            if isinstance(data_dict, dict):
                data_dict = dict(data_dict)
                print(data_dict)
                return data_dict
        except Exception:
            pass
    return data_dict 