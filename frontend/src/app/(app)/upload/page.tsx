import { redirect } from 'next/navigation'

export default function UploadPage() {
  redirect('/resumes?upload=1')
}
