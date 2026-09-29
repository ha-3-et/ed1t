import { NextResponse } from "next/server";
import { Resend } from "resend";

// 環境変数からAPIキーを読み込む
const resend = new Resend(process.env.RESEND_API_KEY);
const contactAddress = process.env.MY_EMAIL_ADDRESS;
const senderFrom =
  process.env.RESEND_FROM_EMAIL || "ed1t.jp <no-reply@ed1t.jp>";

const buildMessageText = (name, email, messageBody) => `
--------------------------------------------------
Webサイトからのお問い合わせ
--------------------------------------------------

■お名前：
${name}

■メールアドレス：
${email}

■お問い合わせ内容：
${messageBody}
      `;

const buildConfirmationText = (name, messageBody) => `
${name} 様

お問い合わせありがとうございます。
以下の内容で送信いたしました。

■お問い合わせ内容：
${messageBody}

内容を確認のうえ、必要に応じてご連絡いたします。
      `;

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, body: messageBody } = body;

    // 必須項目のチェック
    if (!name || !email || !messageBody) {
      return NextResponse.json(
        { error: "必須項目（名前、Email、本文）が不足しています。" },
        { status: 400 },
      );
    }

    // 管理者宛メール
    const adminMail = await resend.emails.send({
      from: senderFrom,
      to: [contactAddress], // .env.localで設定した自分のアドレス宛
      subject: `【ed1t.jp】お問い合わせ: ${name}`,
      reply_to: email, // 返信先を相手のアドレスに指定
      text: buildMessageText(name, email, messageBody),
    });

    if (adminMail.error) {
      console.error("Resend API Error:", adminMail.error);
      return NextResponse.json({ error: adminMail.error.message }, { status: 500 });
    }

    // 送信者宛の確認メール
    const confirmationMail = await resend.emails.send({
      from: senderFrom,
      to: [email],
      subject: "【ed1t.jp】お問い合わせを受け付けました",
      text: buildConfirmationText(name, messageBody),
    });

    if (confirmationMail.error) {
      console.error("Confirmation Mail Error:", confirmationMail.error);
      return NextResponse.json(
        {
          error: confirmationMail.error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ adminMail, confirmationMail });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      { error: "サーバー内部でエラーが発生しました。" },
      { status: 500 },
    );
  }
}
