export const dynamic = "force-dynamic"
import { Suspense } from "react"
import LoginForm from "./login-form"

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"#111418" }} />}>
      <LoginForm />
    </Suspense>
  )
}
