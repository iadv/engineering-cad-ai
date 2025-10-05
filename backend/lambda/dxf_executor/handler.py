import json
import ezdxf
from ezdxf_engine import execute_dxf_code, fix_code_error
import traceback

def lambda_handler(event, context):
    """
    Lambda handler for executing DXF code generation with error recovery
    """
    print(f"Received event: {json.dumps(event)}")
    try:
        # Parse request
        body_str = event.get('body', '{}')
        print(f"Body string: {body_str}")
        body = json.loads(body_str)
        print(f"Parsed body: {json.dumps(body)}")
        code = body.get('code', '')
        max_retries = body.get('max_retries', 3)
        
        if not code:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({'error': 'No code provided'})
            }
        
        # Execute with retry logic
        attempt = 0
        last_error = None
        execution_log = []
        
        while attempt < max_retries:
            attempt += 1
            execution_log.append(f"Attempt {attempt}/{max_retries}")
            
            # Execute the DXF generation code
            result = execute_dxf_code(code)
            
            if result['success']:
                result['execution_log'] = execution_log
                result['attempts'] = attempt
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS'
                    },
                    'body': json.dumps(result)
                }
            else:
                last_error = result['error']
                execution_log.append(f"Error: {last_error}")
                
                # Try to fix the code
                if attempt < max_retries:
                    execution_log.append("Attempting automatic fix...")
                    code = fix_code_error(code, last_error)
                    execution_log.append("Code fixed, retrying...")
        
        # All retries failed
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'error': last_error,
                'success': False,
                'execution_log': execution_log,
                'attempts': attempt
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'error': str(e),
                'traceback': traceback.format_exc(),
                'success': False
            })
        }


def options_handler(event, context):
    """Handle CORS preflight requests"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': ''
    }

