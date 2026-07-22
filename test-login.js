require("dotenv").config();
const { signInAction } = require("./features/auth/actions");

async function run() {
  try {
    const res = await signInAction({ email: "test@test.com", password: "Password123!" });
    console.log("RESULT:", res);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
run();
