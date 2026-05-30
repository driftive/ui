import React from "react";
import Button from "antd/es/button";
import {GithubOutlined} from "@ant-design/icons";
import {motion} from "framer-motion";
import {useLocation} from "react-router";
import {API_URL} from "../../configs.ts";
import "./Login.css";

export const LoginPage: React.FC = () => {
  const location = useLocation();

  const handleLogin = () => {
    const from = location.state?.from?.pathname;
    if (from) {
      sessionStorage.setItem('redirectAfterLogin', from);
    }
    window.location.href = `${API_URL}/v1/auth/github`;
  };

  return (
    <div className="login-page">
      <aside className="login-brand">
        <div className="login-brand-header">
          <div className="login-action-mark" style={{width: 36, height: 36, fontSize: 18, marginBottom: 0, boxShadow: 'none'}}>
            D
          </div>
          <span className="login-brand-wordmark">Driftive</span>
        </div>

        <div className="login-brand-body">
          <div className="login-brand-copy">
            <motion.span
              className="login-brand-eyebrow"
              initial={{opacity: 0, y: 6}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.4, ease: "easeOut"}}
            >
              <span className="login-brand-eyebrow-dot"/>
              Drift detection for Terraform & OpenTofu
            </motion.span>
            <motion.h1
              className="login-brand-headline"
              initial={{opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.5, delay: 0.05, ease: "easeOut"}}
            >
              Catch drift before it ships.
            </motion.h1>
            <motion.p
              className="login-brand-sub"
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.5, delay: 0.12, ease: "easeOut"}}
            >
              Continuous drift detection wired into the GitHub workflow your team already uses.
            </motion.p>
          </div>

          <motion.div
            className="login-preview"
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.55, delay: 0.22, ease: "easeOut"}}
          >
            <div className="login-preview-header">
              <span className="login-preview-title">
                acme/infrastructure · main
              </span>
              <span className="login-preview-tag">Drift detected</span>
            </div>
            <div className="login-preview-body">
              <div className="login-preview-resource">
                <span className="login-preview-marker">~</span>aws_security_group.api
              </div>
              <div className="login-preview-line removed">{`    - from_port = 80`}</div>
              <div className="login-preview-line added">{`    + from_port = 443`}</div>
              <div className="login-preview-resource" style={{marginTop: 4}}>
                <span className="login-preview-marker">~</span>aws_iam_role.lambda_exec
              </div>
              <div className="login-preview-line removed">{`    - managed_policy_arns = [ ... ]`}</div>
            </div>
            <div className="login-preview-footer">
              <span className="login-preview-footer-dot"/>
              GitHub issue opened · #142
            </div>
          </motion.div>
        </div>

        <div className="login-brand-footer">
          © {new Date().getFullYear()} Driftive
        </div>
      </aside>

      <main className="login-action">
        <motion.div
          className="login-action-inner"
          initial={{opacity: 0, y: 12}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.45, ease: "easeOut"}}
        >
          <div className="login-action-mark" aria-hidden="true">D</div>
          <h2>Welcome to Driftive</h2>
          <p className="login-action-sub">
            Sign in to view your drift dashboard and connect your repositories.
          </p>

          <motion.div whileHover={{y: -1}} whileTap={{y: 0}}>
            <Button
              block
              type="primary"
              icon={<GithubOutlined/>}
              size="large"
              onClick={handleLogin}
              className="login-github-button"
            >
              Continue with GitHub
            </Button>
          </motion.div>

          <div className="login-divider">Secure GitHub OAuth</div>

          <p className="login-fineprint">
            By continuing, you authorize Driftive to read your repositories on your behalf.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
