import Document, { Html, Head, Main, NextScript } from 'next/document';

/** Custom Document - must extend Document from next/document. Do not import Html/Head/Main/NextScript outside this file. */
class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="description" content="Last Piece - Discover unique, one-of-a-kind products" />
          <meta name="theme-color" content="#0F172A" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
