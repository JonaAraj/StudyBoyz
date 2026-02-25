const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

const Usuario = sequelize.define("Usuario", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  contraseña: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nombre_completo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  creado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Hook para hashear contraseña antes de guardar
Usuario.beforeCreate(async (usuario) => {
  const salt = await bcrypt.genSalt(10);
  usuario.contraseña = await bcrypt.hash(usuario.contraseña, salt);
});

// Método para verificar contraseña
Usuario.prototype.verificarContraseña = async function (contraseña) {
  return await bcrypt.compare(contraseña, this.contraseña);
};

module.exports = Usuario;
