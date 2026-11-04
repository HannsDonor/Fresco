import net from "node:net";

const port = 3000;

await new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      reject(new Error(
        `Port ${port} is already in use. Stop the existing dev server, then rerun the Cypress command so it can start the app with DB_NAME=fresco_laundry_test.`
      ));
      return;
    }
    reject(error);
  });
  server.listen(port, "::", () => server.close((error) => error ? reject(error) : resolve()));
});
