
import asyncio
from database import supabase

async def main():
    try:
        # Get any user
        user = supabase.table('users').select('*').limit(1).execute()
        if not user.data:
            print('No users found')
            return
        
        u = user.data[0]
        print('User:', u)
        
        # Try to update
        res = supabase.table('users').update({
            'name': u['name'],
            'branch': 'CSE',
            'cgpa': 8.5,
            'roll_no': 'TEST1234',
            'phone': '9999999999'
        }).eq('id', u['id']).execute()
        print('Update Success:', res.data)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
