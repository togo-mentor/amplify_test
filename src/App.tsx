import { Amplify, Auth } from "aws-amplify";

import { Authenticator, withAuthenticator } from "@aws-amplify/ui-react";

import "@aws-amplify/ui-react/styles.css";

import awsExports from "./aws-exports";
import { useState } from "react";

import QRCode from "qrcode.react";
import { CognitoUser } from "aws-amplify/node_modules/@aws-amplify/auth";

// Amplifyの設定
Amplify.configure(awsExports);

function App() {
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [QRCodeUrl, setQRCodeUrl] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // TOTPの設定を行う
  const setUpTOTP = (user: CognitoUser) => {
    Auth.setupTOTP(user).then((code) => {
      console.log(user);
      const issuer = encodeURI("AWSCognito");

      // issuer→Authyに表示されるアプリ名
      // user→アプリ名の下に表示されるユーザー名
      const str =
        "otpauth://totp/AWSCognito:" +
        user.getUsername() +
        "?secret=" +
        code +
        "&issuer=" +
        issuer;
      setQRCodeUrl(str); // QRコードのURLを設定
      setShowQRCode(true); // QRコードを表示
    });
  };

  // tokenの検証
  const veryfyToken = (e: React.FormEvent, user: CognitoUser) => {
    e.preventDefault();
    // 入力したtokenが正しい場合に、2段階認証の設定を完了しデバイスを登録する
    Auth.verifyTotpToken(user, token).then(() => {
      Auth.setPreferredMFA(user, "TOTP");
    });
  };

  // tokenの入力を監視
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value as string);
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          {user && (
            // ユーザーがログインしているときのみ表示
            <>
              <h1>Hello {user.username}</h1>
              <button onClick={(e) => setUpTOTP(user)}>SETUP TOTP</button>
              {showQRCode && (
                <>
                  <QRCode value={QRCodeUrl} />
                  <form onSubmit={(e) => veryfyToken(e, user)}>
                    <input
                      type="text"
                      placeholder="type veryfication code"
                      value={token}
                      onChange={handleTokenChange}
                    />
                    <button>VERIFY</button>
                  </form>
                </>
              )}
              <button onClick={signOut}>Sign out</button>
            </>
          )}
        </main>
      )}
    </Authenticator>
  );
}

export default withAuthenticator(App);
