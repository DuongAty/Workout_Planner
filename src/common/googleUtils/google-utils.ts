export function buildGoogleAuthSuccessHtml(
  accessToken: string,
  refreshToken: string,
  frontendUrl: string,
) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Google Auth</title>
  </head>
  <body>
    <script>
      const data = {
        type: 'GOOGLE_AUTH_SUCCESS',
        accessToken: '${accessToken}',
        refreshToken: '${refreshToken}'
      };

      window.opener.postMessage(data, '${frontendUrl}');
      window.close();
    </script>
  </body>
</html>
`;
}
