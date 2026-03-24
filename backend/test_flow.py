import asyncio
import aiohttp
import json

async def test_flow():
    base_url = "http://127.0.0.1:8000/api"
    username = "testuser"
    password = "testpassword123"

    print("1. Registering user...")
    async with aiohttp.ClientSession() as session:
        # Register
        async with session.post(f"{base_url}/users/register/", json={
            "username": username,
            "password": password
        }) as resp:
            if resp.status not in (201, 400): # 400 if already exists
                print(f"Register failed: {resp.status} {await resp.text()}")
                return
            print("Register OK or already exists")

        # Login
        print("2. Logging in...")
        async with session.post(f"{base_url}/users/login/", json={
            "username": username,
            "password": password
        }) as resp:
            if resp.status != 200:
                print(f"Login failed: {resp.status} {await resp.text()}")
                return
            data = await resp.json()
            token = data.get("access")
            print(f"Login OK, token received: {token[:10]}...")

        # Websocket
        print("3. Connecting to WebSocket...")
        ws_url = f"ws://127.0.0.1:8000/ws/chat/?token={token}"
        try:
            async with session.ws_connect(ws_url) as ws:
                print("WebSocket Connected!")
                
                # Wait for presence message
                msg = await ws.receive()
                print(f"Received from WS: {msg.data}")

                print("Sending chat message...")
                await ws.send_json({"message": "Hello API test!"})

                msg2 = await ws.receive()
                print(f"Received from WS: {msg2.data}")
                
                print("Flow completely functional.")
        except Exception as e:
            print(f"WebSocket Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_flow())
