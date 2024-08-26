import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default async function handler(req, res) {
  console.log('Review Goals accessed');
  console.log('Request method:', req.method);
  console.log('Request body:', req.body);

  // Initialize Firebase
  const firebaseConfig = {
    type: process.env.FIREBASE_TYPE,
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let fid;
  if (req.method === 'POST') {
    fid = req.body?.untrustedData?.fid;
  } else {
    fid = req.query.fid;
  }

  console.log('FID:', fid);

  if (!fid) {
    console.log('No FID provided');
    return res.status(400).json({ error: "FID is required" });
  }

  // Fetch user goals from Firestore
  try {
    const docRef = doc(db, "goals", fid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('User goal data:', data);

      // Pass the data to ogReview.js for OG image generation
      const imageUrl = `${process.env.NEXT_PUBLIC_BASE_PATH}/api/ogReview?goal=${encodeURIComponent(data.goal)}&deadline=${encodeURIComponent(data.deadline)}&progress=${encodeURIComponent(data.progress)}`;

      // Return the frame with proper meta tags
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${imageUrl}" />
            <meta property="fc:frame:button:1" content="Return Home" />
            <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_PATH}" />
          </head>
        </html>
      `;
      return res.setHeader('Content-Type', 'text/html').status(200).send(html);

    } else {
      console.log('No goal found for this user.');
      const imageUrl = `${process.env.NEXT_PUBLIC_BASE_PATH}/api/ogReview?error=no_goal`;

      // Return the frame with proper meta tags
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${imageUrl}" />
            <meta property="fc:frame:button:1" content="Return Home" />
            <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_PATH}" />
          </head>
        </html>
      `;
      return res.setHeader('Content-Type', 'text/html').status(200).send(html);
    }
  } catch (error) {
    console.error('Error fetching user goal:', error);
    return res.status(500).json({ error: "Error fetching user goal" });
  }
}