@echo off
npx -y create-next-app@latest saferace --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
xcopy /E /I /H /Y saferace .
rmdir /S /Q saferace
npm install @supabase/ssr @supabase/supabase-js lucide-react zod react-hook-form @hookform/resolvers leaflet react-leaflet @types/leaflet @turf/turf qrcode.react html5-qrcode clsx tailwind-merge date-fns
