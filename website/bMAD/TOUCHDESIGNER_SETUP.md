# TouchDesigner Project Setup Guide

## Creating Your TouchDesigner Project

### Step 1: Basic Setup

1. **Open TouchDesigner**
   - Create a new project (File → New)
   - Save as `capstone-landing.toe`

2. **Set Project Settings**
   - Set resolution: 1920x1080 (or your preferred size)
   - Set FPS: 30 or 60
   - Enable "Interactive" mode

### Step 2: Create Visual Composition

#### Basic Network Structure:
```
project1
├── container1 (Main Visual Container)
│   ├── noise1 (Noise TOP)
│   ├── transform1 (Transform TOP)
│   ├── composite1 (Composite TOP)
│   └── render1 (Render TOP)
└── webRender1 (Web Render TOP)
    └── [connect to container1/render1]
```

#### Example Setup:

1. **Create a Container**
   - Add a `containerCOMP` named `mainVisual`
   - This will hold your main visual composition

2. **Inside Container, Create Visuals**
   - Add `noiseTOP` for procedural generation
   - Add `transformTOP` for movement/animation
   - Add `compositeTOP` for blending
   - Add `renderTOP` as final output

3. **Create Web Render TOP**
   - Add `webRenderTOP` at the root level
   - Connect it to your main visual output
   - Set parameters:
     - **Active**: On
     - **Port**: 8080
     - **Width**: 1920
     - **Height**: 1080
     - **FPS**: 30

### Step 3: WebSocket Communication (Optional)

#### Receive Parameters from Web:

1. **Add WebSocket DAT**
   - Add `webSocketDAT` component
   - Set parameters:
     - **Active**: On
     - **Port**: 8081 (different from Web Render)
     - **Protocol**: WebSocket

2. **Parse Incoming Messages**
   - Add `scriptDAT` to parse JSON messages
   - Extract parameters and update visuals

#### Example Script (scriptDAT):
```python
def onReceiveText(dat, rowIndex, message, peerId, data):
    import json
    try:
        data = json.loads(message)
        if data.get('type') == 'parameter':
            param_name = data.get('name')
            param_value = data.get('value')
            
            # Update TouchDesigner parameters based on received data
            if param_name == 'mouseX':
                op('mainVisual/transform1').par.tx = param_value * 1920
            elif param_name == 'mouseY':
                op('mainVisual/transform1').par.ty = param_value * 1080
            elif param_name == 'enable':
                op('mainVisual').par.display = param_value
                
    except Exception as e:
        print(f"Error parsing message: {e}")
    
    return
```

### Step 4: HTTP Server (Alternative to WebSocket)

1. **Add HTTP Server DAT**
   - Add `httpServerDAT` component
   - Set parameters:
     - **Active**: On
     - **Port**: 8082
     - **Allow CORS**: On (important for web integration)

2. **Create Endpoints**
   - `/api/parameter` - Receive parameters
   - `/api/status` - Get status
   - `/api/trigger` - Trigger events

#### Example HTTP Server Setup:
```python
def onPostRequest(dat, request, reply):
    import json
    data = json.loads(request.body)
    
    if request.uri == '/api/parameter':
        param_name = data.get('name')
        param_value = data.get('value')
        # Update parameters
        op('mainVisual/transform1').par.tx = param_value
        reply.text = 'OK'
    elif request.uri == '/api/trigger':
        event_name = data.get('name')
        # Handle event
        reply.text = 'OK'
    
    return
```

### Step 5: Interactive Elements

#### Mouse/Touch Interaction:
1. **Receive mouse coordinates from web**
   - Web sends normalized coordinates (0-1)
   - TouchDesigner maps to screen coordinates
   - Update visual parameters

#### Wallet Connection Events:
1. **Listen for wallet events**
   - Web sends event when wallet connects
   - TouchDesigner updates visuals (e.g., change color, trigger animation)

#### NFT Minting Events:
1. **Listen for mint events**
   - Web sends event when NFT is minted
   - TouchDesigner plays celebration animation
   - Update visual state

### Step 6: Animation and Effects

#### Create Animations:
1. **Use CHOPs (Channel Operators)**
   - Add `waveCHOP` for smooth animations
   - Add `mathCHOP` for complex patterns
   - Add `noiseCHOP` for organic movement

2. **Connect to Parameters**
   - Connect CHOP channels to TOP parameters
   - Create dynamic, animated visuals

#### Example Animation Setup:
```
wave1 (Wave CHOP)
  └─> transform1.tx (Transform TOP - Translate X)
  └─> transform1.ty (Transform TOP - Translate Y)
```

### Step 7: Performance Optimization

1. **Reduce Resolution**
   - Lower resolution for better performance
   - Web Render can upscale if needed

2. **Limit Effects**
   - Use efficient operators
   - Avoid expensive operations in real-time

3. **Frame Rate**
   - Set appropriate FPS (30 is usually sufficient)
   - Lower FPS for complex visuals

### Step 8: Testing

1. **Local Testing**
   - Open TouchDesigner project
   - Start Web Render TOP
   - Open browser to `http://localhost:8080`
   - Verify stream works

2. **Integration Testing**
   - Open your website
   - Verify TouchDesigner stream displays
   - Test parameter sending
   - Test event triggers

### Step 9: Deployment

#### Local Development:
- Run TouchDesigner on your local machine
- Web connects to `localhost:8080`

#### Production:
- Run TouchDesigner on a server
- Update web client to connect to server IP/domain
- Configure firewall for ports 8080, 8081, 8082
- Use reverse proxy (nginx) for HTTPS

## Example TouchDesigner Network

### Minimal Working Example:
```
project1
├── constant1 (Constant TOP) - Solid color background
├── noise1 (Noise TOP) - Procedural texture
├── composite1 (Composite TOP) - Blend constant and noise
│   ├─> constant1
│   └─> noise1
└── webRender1 (Web Render TOP)
    └─> composite1
```

### Interactive Example:
```
project1
├── container1 (Container)
│   ├── noise1 (Noise TOP)
│   ├── transform1 (Transform TOP)
│   │   └─> noise1
│   ├── math1 (Math CHOP) - Animation
│   │   └─> transform1.tx (drive translation)
│   └── render1 (Render TOP)
│       └─> transform1
├── webRender1 (Web Render TOP)
│   └─> container1/render1
└── webSocketDAT1 (WebSocket DAT)
    └─> script1 (Script DAT) - Parse messages
```

## Troubleshooting

### Web Render Not Showing:
- Check Web Render TOP is active
- Check port is correct (8080)
- Check firewall isn't blocking port
- Verify browser can access `http://localhost:8080`

### WebSocket Not Connecting:
- Check WebSocket DAT is active
- Check port is different from Web Render (8081)
- Verify web client is connecting to correct port
- Check CORS settings if needed

### Performance Issues:
- Reduce resolution
- Simplify visual network
- Lower FPS
- Use more efficient operators

## Next Steps

1. ✅ Create TouchDesigner project file
2. ✅ Set up Web Render TOP
3. ✅ Create basic visual composition
4. ⏳ Add WebSocket/HTTP server for parameters
5. ⏳ Test local connection
6. ⏳ Integrate with web events (wallet, mint)
7. ⏳ Optimize performance
8. ⏳ Deploy to production

