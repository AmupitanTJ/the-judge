import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import "../../auth.css";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <section className="auth-intro">
        <Link className="auth-brand" href="/sources">
          <Image src="/brand/the-judge-page-logo.png" width={144} height={144} alt="The Judge" priority />
          <span>THE JUDGE</span>
        </Link>
        <div className="auth-message">
          <p>Nigerian legal intelligence</p>
          <h1>Your authorities. Your matters. One workspace.</h1>
          <span>Return to your private court cases, research projects, saved authorities and source-backed legal answers.</span>
        </div>
        <p className="auth-foot">Legal research support, not a substitute for professional judgment.</p>
      </section>
      <section className="auth-form">
        <div className="auth-form-inner">
          <div className="auth-form-head"><p>Welcome back</p><h2>Sign in to The Judge</h2></div>
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl="/"
            appearance={{ elements: { headerTitle: "auth-clerk-hidden", headerSubtitle: "auth-clerk-hidden" } }}
          />
        </div>
      </section>
    </main>
  );
}
