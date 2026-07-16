sed -i 's/import { auth, googleProvider }/import { auth, googleProvider, db }/g' src/app/components/pages/LoginPage.tsx
sed -i 's/import { signInWithPopup } from "firebase\/auth";/import { signInWithPopup } from "firebase\/auth";\nimport { doc, getDoc } from "firebase\/firestore";/g' src/app/components/pages/LoginPage.tsx
