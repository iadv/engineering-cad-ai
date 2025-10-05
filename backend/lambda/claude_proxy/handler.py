import json
import os
import anthropic
import traceback

def lambda_handler(event, context):
    """
    Proxy for Claude API calls with error handling and retry logic
    """
    print(f"Received event: {json.dumps(event)}")
    try:
        body = json.loads(event.get('body', '{}'))
        print(f"Parsed body: {json.dumps(body)}")
        user_message = body.get('userMessage', '')
        system_prompt = body.get('systemPrompt', '')
        is_code_gen = body.get('isCodeGen', False)
        conversation_history = body.get('conversationHistory', [])
        error_context = body.get('errorContext', None)
        
        if not user_message:
            return error_response('No user message provided', 400)
        
        client = anthropic.Anthropic(api_key=os.environ['CLAUDE_API_KEY'])
        
        # Build messages array
        messages = []
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add error context if this is a fix request
        if error_context:
            user_message = f"""Previous code failed with error:
{error_context}

Please fix the code to address this error.

Original request: {user_message}"""
        
        messages.append({"role": "user", "content": user_message})
        
        # Determine token limit based on task
        max_tokens = 8000 if is_code_gen else 4000
        
        # Call Claude API
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=max_tokens,
            messages=messages,
            system=system_prompt,
            temperature=0.7 if not is_code_gen else 0.3  # Lower temp for code generation
        )
        
        text_content = next(
            (block.text for block in message.content if block.type == "text"),
            ""
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'content': text_content,
                'usage': {
                    'input_tokens': message.usage.input_tokens,
                    'output_tokens': message.usage.output_tokens
                }
            })
        }
        
    except anthropic.APIError as e:
        return error_response(f"Claude API error: {str(e)}", 500)
    except Exception as e:
        return error_response(f"Unexpected error: {str(e)}\n{traceback.format_exc()}", 500)


def error_response(message: str, status_code: int):
    """Generate error response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': json.dumps({'error': message})
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

