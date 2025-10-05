import ezdxf
from ezdxf.enums import TextEntityAlignment
import io
import re
import sys
from io import StringIO

def execute_dxf_code(code: str) -> dict:
    """
    Execute user-provided DXF generation code and return DXF content
    """
    # Initialize these BEFORE try block to avoid NameError in exception handler
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    try:
        # Capture stdout/stderr
        sys.stdout = StringIO()
        sys.stderr = StringIO()
        
        # Create namespace for code execution
        namespace = {
            'ezdxf': ezdxf,
            'TextEntityAlignment': TextEntityAlignment,
            '__builtins__': __builtins__
        }
        
        print(f"[ENGINE] Executing code ({len(code)} chars)")
        
        # Execute the code
        exec(code, namespace)
        
        print("[ENGINE] Code executed successfully")
        
        # Restore stdout/stderr
        stdout_output = sys.stdout.getvalue()
        stderr_output = sys.stderr.getvalue()
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
        # Get the document
        doc = namespace.get('doc')
        if not doc:
            raise ValueError("Code did not produce a 'doc' variable. Ensure your code creates an ezdxf document named 'doc'.")
        
        # Validate document
        if not isinstance(doc, ezdxf.document.Drawing):
            raise ValueError("'doc' variable is not an ezdxf Drawing object")
        
        print(f"[ENGINE] Generating DXF output")
        
        # Generate DXF string
        dxf_stream = io.StringIO()
        doc.write(dxf_stream)
        dxf_content = dxf_stream.getvalue()
        
        # Get statistics
        entities_count = len(list(doc.modelspace()))
        layers_count = len(list(doc.layers))
        
        # Get bounds
        try:
            msp = doc.modelspace()
            extents = msp.extents()
            bounds = {
                'min_x': extents.extmin.x,
                'min_y': extents.extmin.y,
                'max_x': extents.extmax.x,
                'max_y': extents.extmax.y
            }
        except:
            bounds = None
        
        print(f"[ENGINE] Success! Generated {entities_count} entities across {layers_count} layers")
        
        return {
            'success': True,
            'dxf': dxf_content,
            'stats': {
                'entities': entities_count,
                'layers': layers_count,
                'bounds': bounds
            },
            'output': stdout_output,
            'warnings': stderr_output if stderr_output else None
        }
        
    except Exception as e:
        print(f"[ENGINE] Error during execution: {type(e).__name__}: {str(e)}")
        # Restore stdout/stderr
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
        import traceback
        error_traceback = traceback.format_exc()
        print(f"[ENGINE] Traceback:\n{error_traceback}")
        
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__,
            'traceback': error_traceback
        }


def fix_code_error(code: str, error: str) -> str:
    """
    Attempt basic automatic fixes for common code errors
    """
    # Common fix patterns
    fixes = [
        # Missing imports
        (r"NameError: name 'date' is not defined", 
         lambda c: "from datetime import date\n" + c if "from datetime import date" not in c else c),
        
        # Missing doc variable
        (r"'doc' variable",
         lambda c: c.replace("document =", "doc =").replace("drawing =", "doc =") if "doc =" not in c else c),
        
        # Wrong modelspace call
        (r"modelspace\(\) takes",
         lambda c: c.replace("modelspace(doc)", "doc.modelspace()").replace("msp = modelspace", "msp = doc.modelspace()")),
    ]
    
    for pattern, fix_func in fixes:
        if re.search(pattern, error):
            code = fix_func(code)
    
    return code


def validate_dxf_code(code: str) -> dict:
    """
    Validate DXF code without executing it (static analysis)
    """
    warnings = []
    errors = []
    
    # Check for required imports
    if 'import ezdxf' not in code:
        errors.append("Missing 'import ezdxf' statement")
    
    # Check for doc variable
    if 'doc =' not in code and 'doc=' not in code:
        warnings.append("No 'doc' variable assignment found")
    
    # Check for modelspace usage
    if 'modelspace()' in code and 'doc.modelspace()' not in code:
        warnings.append("Modelspace should be called as 'doc.modelspace()'")
    
    # Check for common issues
    if 'ezdxf.new(' not in code and 'ezdxf.new(' not in code:
        warnings.append("No document creation found (ezdxf.new())")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings
    }

