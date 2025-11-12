# Next Steps: TouchDesigner Landing Page Integration

## ✅ What's Been Completed

1. **Web Integration Files Created:**
   - `touchdesigner-client.js` - WebSocket/HTTP client for TouchDesigner communication
   - `touchdesigner-integration.js` - UI integration and event handling
   - `touchdesigner.css` - Styling for TouchDesigner landing page
   - `index.html` - Updated with TouchDesigner landing section
   - `app.js` - Updated to send events to TouchDesigner

2. **Documentation Created:**
   - `TOUCHDESIGNER_INTEGRATION.md` - Comprehensive integration guide
   - `TOUCHDESIGNER_SETUP.md` - TouchDesigner project setup instructions
   - `NEXT_STEPS.md` - This file

## 🎯 Next Steps to Complete Integration

### Step 1: Install and Set Up TouchDesigner
- [ ] Download and install TouchDesigner (if not already installed)
- [ ] Purchase license or use free non-commercial version
- [ ] Familiarize yourself with TouchDesigner interface

### Step 2: Create TouchDesigner Project
- [ ] Create new TouchDesigner project file (`capstone-landing.toe`)
- [ ] Set up basic visual composition (see `TOUCHDESIGNER_SETUP.md`)
- [ ] Add Web Render TOP component
- [ ] Configure Web Render TOP:
  - Port: 8080
  - Resolution: 1920x1080 (or your preference)
  - FPS: 30
  - Active: On

### Step 3: Set Up Communication (Optional but Recommended)
- [ ] Add WebSocket DAT for bidirectional communication
- [ ] Set up script to receive parameters from web
- [ ] Test parameter receiving (mouse position, events)

### Step 4: Test Local Connection
- [ ] Open TouchDesigner project
- [ ] Start Web Render TOP
- [ ] Open browser to `http://localhost:8080` to verify stream works
- [ ] Open your website and verify TouchDesigner stream displays
- [ ] Test mouse interaction (should send coordinates to TD)
- [ ] Test wallet connection (should trigger TD event)

### Step 5: Customize Visuals
- [ ] Create your visual composition in TouchDesigner
- [ ] Add animations and effects
- [ ] Connect web events to visual changes:
  - Wallet connection → Change colors/animation
  - Mouse movement → Interactive elements
  - NFT mint → Celebration animation
- [ ] Optimize performance

### Step 6: Integration Testing
- [ ] Test wallet connection integration
- [ ] Test mint button integration
- [ ] Test burn button integration
- [ ] Test mouse/touch interactions
- [ ] Test transition from TD landing to main content
- [ ] Test on different browsers
- [ ] Test on mobile devices (if needed)

### Step 7: Production Deployment
- [ ] Decide on deployment strategy:
  - Option A: Run TouchDesigner on dedicated server
  - Option B: Use local machine (development only)
  - Option C: Export TD content to video/web format
- [ ] Update web client configuration:
  - Change `localhost` to server IP/domain
  - Update ports if needed
  - Configure CORS if necessary
- [ ] Set up reverse proxy (nginx) for HTTPS
- [ ] Configure firewall for required ports
- [ ] Test production setup

## 🔧 Configuration

### Current Configuration (in `touchdesigner-integration.js`):
```javascript
const TD_HOST = 'localhost';
const TD_PORT = 8080;
const USE_IFRAME = true; // Set to false for WebSocket canvas rendering
const TD_DISPLAY_DURATION = 5000; // Show TD for 5 seconds
const AUTO_TRANSITION = true; // Auto-transition to main content
```

### To Change Configuration:
1. Edit `touchdesigner-integration.js`
2. Modify constants at the top of the file
3. Update TouchDesigner Web Render TOP port to match

## 📁 File Structure

```
website/
├── index.html (updated with TD landing)
├── app.js (updated with TD integration)
├── touchdesigner-client.js (new - WebSocket client)
├── touchdesigner-integration.js (new - UI integration)
├── touchdesigner.css (new - TD styling)
├── TOUCHDESIGNER_INTEGRATION.md (integration guide)
├── TOUCHDESIGNER_SETUP.md (TD setup guide)
└── NEXT_STEPS.md (this file)
```

## 🚀 Quick Start

1. **Open TouchDesigner**
   - Create new project
   - Add Web Render TOP
   - Set port to 8080
   - Connect your visuals to Web Render TOP
   - Activate Web Render TOP

2. **Open Your Website**
   - Serve website locally (e.g., `python -m http.server 8000`)
   - Open browser to `http://localhost:8000`
   - TouchDesigner stream should appear

3. **Test Integration**
   - Move mouse (should send coordinates to TD)
   - Click "Connect Wallet" (should trigger TD event)
   - Check browser console for connection status

## 🐛 Troubleshooting

### TouchDesigner Stream Not Showing:
- Check Web Render TOP is active in TouchDesigner
- Check port is correct (8080)
- Check firewall isn't blocking port
- Verify browser can access `http://localhost:8080` directly
- Check browser console for errors

### WebSocket Not Connecting:
- Check WebSocket DAT is active in TouchDesigner
- Check port is different from Web Render (use 8081)
- Verify web client is connecting to correct port
- Check browser console for connection errors

### Events Not Working:
- Check TouchDesigner is receiving messages (check DAT output)
- Verify event names match between web and TD
- Check script DAT is parsing messages correctly
- Verify parameters are being updated in TD

## 📚 Resources

- TouchDesigner Documentation: https://docs.derivative.ca/
- Web Render TOP: https://docs.derivative.ca/Web_Render_TOP
- WebSocket DAT: https://docs.derivative.ca/WebSocket_DAT
- TouchDesigner Forum: https://forum.derivative.ca/

## 💡 Tips

1. **Start Simple**: Begin with a basic visual composition, then add complexity
2. **Test Frequently**: Test each component as you build it
3. **Optimize Performance**: Monitor FPS and optimize as needed
4. **Use Events**: Leverage web events to create interactive experiences
5. **Fallback Plan**: Ensure website works even if TouchDesigner is unavailable

## 🎨 Creative Ideas

- Use wallet address to generate unique visuals
- Create particle effects on NFT mint
- Use mouse position for interactive 3D elements
- Animate transitions based on user actions
- Create dynamic backgrounds that respond to events
- Use sound/music to drive visuals (if you add audio)

## ⚠️ Important Notes

- TouchDesigner must be running for the stream to work
- Web Render TOP uses significant resources
- Consider performance impact on user's device
- Test on different browsers and devices
- Have a fallback if TouchDesigner is unavailable
- Consider using a dedicated server for production

## 🎯 Success Criteria

You'll know the integration is working when:
- ✅ TouchDesigner stream displays on landing page
- ✅ Mouse movement affects TouchDesigner visuals
- ✅ Wallet connection triggers TouchDesigner events
- ✅ Smooth transition from TD landing to main content
- ✅ All events are properly communicated between web and TD
- ✅ Performance is acceptable (30+ FPS)
- ✅ Works on target browsers and devices

---

**Ready to start?** Begin with Step 1 and work through each step sequentially. Refer to the detailed guides (`TOUCHDESIGNER_INTEGRATION.md` and `TOUCHDESIGNER_SETUP.md`) for more information.

Good luck with your Capstone project! 🚀

