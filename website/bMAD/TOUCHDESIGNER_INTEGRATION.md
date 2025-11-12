# TouchDesigner Landing Page Integration Guide

## Overview
This guide outlines the steps to integrate TouchDesigner as the landing page for your Capstone NFT Mint website.

## Integration Methods

### Method 1: Web Render TOP + HTTP Server (Recommended for Production)
- TouchDesigner streams content via HTTP server
- Low latency, good quality
- Requires TouchDesigner to be running on a server

### Method 2: WebSocket Streaming
- Real-time bidirectional communication
- Can send parameters from web to TouchDesigner
- Good for interactive experiences

### Method 3: WebRTC (Best for Low Latency)
- Lowest latency streaming
- More complex setup
- Best for interactive installations

## Step-by-Step Implementation

### Step 1: TouchDesigner Setup

1. **Create a new TouchDesigner project (.toe file)**
   - Set up your visual composition
   - Configure output resolution (recommended: 1920x1080 or 1280x720)

2. **Add Web Render TOP**
   - Create a `webRender` TOP in your network
   - Connect your main visual output to the Web Render TOP
   - Configure Web Render settings:
     - Port: 8080 (or your preferred port)
     - Enable "Active" parameter
     - Set appropriate FPS (30-60)

3. **Alternative: Use HTTP Server DAT**
   - Create an `httpServer` DAT
   - Configure to serve frames or video stream
   - Set up endpoints for parameter control

### Step 2: Web Integration

#### Option A: Direct HTTP Stream (Simplest)
```html
<!-- In index.html -->
<iframe 
  id="touchdesigner-stream" 
  src="http://localhost:8080" 
  frameborder="0"
  style="width: 100%; height: 100vh; position: absolute; top: 0; left: 0;">
</iframe>
```

#### Option B: WebSocket with Canvas (More Control)
- Use WebSocket to receive frame data
- Render to HTML5 Canvas
- Allows for overlays and custom UI

#### Option C: WebRTC (Best Performance)
- Use WebRTC for low-latency streaming
- Requires additional setup in TouchDesigner

### Step 3: Communication Setup

**From Web to TouchDesigner:**
- Use WebSocket to send parameters
- TouchDesigner receives via `webSocketDAT` or `httpServer` DAT
- Parse JSON data and update parameters

**From TouchDesigner to Web:**
- Stream visual output via Web Render
- Send metadata via WebSocket
- Trigger events in JavaScript

### Step 4: Landing Page Structure

1. **Replace/Augment Loading Screen**
   - Show TouchDesigner content immediately or after loading
   - Transition from TD content to main site

2. **Full-Screen Landing Experience**
   - TouchDesigner takes full viewport
   - Overlay UI elements (navigation, buttons)
   - Smooth transitions

3. **Interactive Elements**
   - Mouse/touch interactions affect TD parameters
   - Wallet connection triggers TD changes
   - NFT minting updates visuals

## Implementation Files

### Files to Create:
1. `touchdesigner-client.js` - WebSocket/HTTP client for TD
2. `touchdesigner.css` - Styling for TD container
3. Update `index.html` - Add TD landing section
4. TouchDesigner project file (`.toe`) - Visual content

### TouchDesigner Network Structure:
```
project1
├── container1 (Main Visual)
│   ├── noise1
│   ├── transform1
│   └── composite1
├── webRender1 (Web Output)
│   └── [connected to container1]
├── webSocketDAT1 (Optional - for parameters)
└── httpServer1 (Optional - for HTTP streaming)
```

## Next Steps

1. ✅ Create JavaScript client for TouchDesigner connection
2. ✅ Update HTML to include TD landing section
3. ✅ Add CSS for full-screen TD experience
4. ⏳ Set up TouchDesigner project with Web Render
5. ⏳ Test local connection
6. ⏳ Deploy TouchDesigner server (or use local)
7. ⏳ Add interactive parameter control
8. ⏳ Integrate with wallet/NFT functionality

## Configuration

### Local Development
- TouchDesigner runs on localhost
- Web server connects to `http://localhost:8080`
- CORS may need to be configured

### Production Deployment
- TouchDesigner runs on dedicated server
- Use domain/IP for connection
- Consider CDN for static assets
- Set up SSL/HTTPS for secure connection

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Configure TouchDesigner HTTP server to allow cross-origin
2. **Connection Refused**: Check TouchDesigner is running and port is correct
3. **Performance**: Optimize TD network, reduce resolution if needed
4. **Latency**: Use WebRTC for lower latency, or reduce FPS

## Resources
- TouchDesigner Documentation: https://docs.derivative.ca/
- Web Render TOP: https://docs.derivative.ca/Web_Render_TOP
- WebSocket DAT: https://docs.derivative.ca/WebSocket_DAT
- HTTP Server DAT: https://docs.derivative.ca/HTTP_Server_DAT

