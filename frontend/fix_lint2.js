const fs = require('fs');
const path = require('path');

const replacements = {
  'src/app/(auth)/login/page.tsx': [
    ["import Image from \"next/image\";", "import Image from \"next/image\";\nimport { Brain } from \"lucide-react\";"]
  ],
  'src/app/(auth)/signup/page.tsx': [
    ["// import { ArrowRightIcon } from '@heroicons/react/24/outline';", ""],
    ["// import { Button } from '@/components/ui/button';", ""],
    ["// import PremiumButton from '@/components/ui/PremiumButton';", ""],
    ["import { Brain, Activity, CheckCircle2 } from 'lucide-react';", "import { Brain, Activity, CheckCircle2, Target } from 'lucide-react';"]
  ],
  'src/auth/api.ts': [
    ["} catch (error: any) {", "} catch (error: unknown) {"]
  ],
  'src/auth/AuthContext.tsx': [
    ["// Legacy support for OAuth redirect if needed", ""]
  ],
  'src/components/dashboard/StrategicStateBanner.tsx': [
    ["{ metrics }: { metrics: unknown }", "{}: { metrics?: unknown }"]
  ],
  'src/context/LivingSystemContext.tsx': [
    ["import React, { createContext, useContext, useEffect } from 'react';", "import React, { createContext, useContext } from 'react';"]
  ]
};

for (const [file, reps] of Object.entries(replacements)) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [oldStr, newStr] of reps) {
      content = content.replace(oldStr, newStr);
    }
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

// Special case for auth/AuthContext.tsx where token is unused
let authCtxPath = path.join(__dirname, 'src/auth/AuthContext.tsx');
if (fs.existsSync(authCtxPath)) {
  let content = fs.readFileSync(authCtxPath, 'utf8');
  content = content.replace(/const handleLoginWithToken = useCallback\(\(token: string\) => \{\n\s*\}, \[\]\);/g, "const handleLoginWithToken = useCallback(() => {}, []);");
  fs.writeFileSync(authCtxPath, content, 'utf8');
}
