const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Archivo = sequelize.define("Archivo", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Usuarios",
      key: "id",
    },
  },
  nombre_original: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nombre_guardado: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  tipo_archivo: {
    type: DataTypes.ENUM("audio", "pdf", "otro"),
    allowNull: false,
  },
  tamaño: {
    type: DataTypes.BIGINT,
    allowNull: false, // tamaño en bytes
  },
  ruta_archivo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  descargado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  creado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Archivo;
