from fastapi import Header, HTTPException
from supabase_client import supabase

def verify_auth(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header provided")

    token = authorization.replace("Bearer ", "")

    try:
        user_response = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not user_response or not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user_response.user