import asyncio
from database import supabase

async def main():
    try:
        user = supabase.table('users').select('*').limit(1).execute()
        u = user.data[0]
        print("Testing update for:", u['email'])
        
        # We know we converted "" to None in main.py, so passing None here to simulate.
        payload = {'cgpa': None, 'branch': None, 'roll_no': None, 'phone': None}
        res = supabase.table('users').update(payload).eq('id', u['id']).execute()
        print('Update Success:', res.data)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        
        # If it's a postgrest APIError, it might have details
        if hasattr(e, 'details'):
            print("APIError Details:", e.details)
        if hasattr(e, 'message'):
            print("APIError Message:", e.message)
            
if __name__ == "__main__":
    asyncio.run(main())
