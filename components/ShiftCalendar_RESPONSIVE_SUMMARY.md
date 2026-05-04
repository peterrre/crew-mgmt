## Summary: ShiftCalendar Responsive Improvements

### What I Did
Made the ShiftCalendar component responsive for small screens to reduce clutter and improve mobile UX by:
1. Replaced fixed calendar height (600px) with responsive height (`h-[60vh] min-h-[300px] w-full`)
2. Made calendar fill its container (`style={{ height: '100%' }}`)
3. Changed assignment panel from fixed width (`w-[400px]`) to responsive width (`w-[90vw] max-w-[400px] max-h-[80vh] overflow-y-auto`)

### What I Accomplished
- Calendar now adapts to screen size: 60% viewport height (min 300px), eliminating overflow on small screens
- Assignment panel uses up to 90% viewport width on mobile, maxing at 400px on desktop
- Maintains vertical scrolling for panel when content exceeds 80vh viewport height
- Preserves all existing functionality while significantly improving mobile usability
- Addresses user feedback: "Kalender Ansicht wirkt auf kleinen Bildschirmen viel zu unaufgeräumt"

### Files Modified
- `/home/hermes/crew-mgmt/components/ShiftCalendar.tsx`

### Expected Outcome
- Reduced clutter on small screens
- Improved mobile UX with responsive, adaptive dimensions
- Maintains Apple-like UX principles (clean layout, clear hierarchy, soft colors)
- Component now works well on both mobile and desktop devices