#!/bin/bash
# Start backend
cd "resume-parser/backend" && npm run dev &

# Start auth page (this one is working correctly)
npx serve "auth" -l 5173 &

# Start frontend
cd "resume-parser" && npm start &

wait