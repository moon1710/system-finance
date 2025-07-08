const bcrypt = require("bcrypt");

const nuevaPassword = "NuevaContraSegura123!";
bcrypt.hash(nuevaPassword, 10).then((hash) => {
  console.log("Hash generado:", hash);
});
