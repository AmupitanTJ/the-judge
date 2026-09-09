import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import "../../auth.css";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <section className="auth-intro">
        <Link className="auth-brand" href="/sources">
          <Image src="/brand/the-judge-page-logo.png" width={74} height={74} alt="The Judge" priority />
          <span>THE JUDGE</span>
        </Link>
        <div className="auth-message">
          <p>Create your private workspace</p>
          <h1>Research Nigerian law with a visible evidence trail.</h1>
          <span>Organise court cases, preserve research projects and return to every authority used in an answer.</span>
        </div>
        <p className="auth-foot">Your matters and research history are isolated to your account.</p>
      </section>
      <section className="auth-form">
        <div className="auth-form-inner">
          <div className="auth-form-head"><p>Get started</p><h2>Create your account</h2></div>
          <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/" />
        </div>
      </section>
    </main>
  );
}
