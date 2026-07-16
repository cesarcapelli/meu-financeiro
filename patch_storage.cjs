const fs = require('fs');
let code = fs.readFileSync('src/app/components/pages/HomeSettingsSheet.tsx', 'utf-8');

code = code.replace(
`import { db, storage } from "../../store/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";`,
`import { db } from "../../store/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, arrayUnion } from "firebase/firestore";`
);

code = code.replace(
`      if (file) {
        const ext = file.name.split(".").pop();
        const storageRef = ref(storage, \`homes/\${targetHomeId}/profile.\${ext}\`);
        const snapshot = await uploadBytes(storageRef, file);
        newPhotoUrl = await getDownloadURL(snapshot.ref);
      }`,
`      if (file) {
        // Convert to base64 to store in Firestore (since Storage bucket might not be configured)
        newPhotoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              const MAX_WIDTH = 400;
              const MAX_HEIGHT = 400;
              let width = img.width;
              let height = img.height;
              
              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              canvas.width = width;
              canvas.height = height;
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.7));
            };
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      }`
);

fs.writeFileSync('src/app/components/pages/HomeSettingsSheet.tsx', code);
