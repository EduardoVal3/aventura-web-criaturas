import { z } from "zod";

export const esquemaRegistro = z.object({
  nombreUsuario: z
    .string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "El nombre solo puede contener letras, números y guión bajo.",
    ),
  correo: z
    .string()
    .email("Ingresa un correo electrónico con formato válido."),
  clave: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .regex(/\d/, "La contraseña debe incluir al menos un número.")
    .regex(
      /[^a-zA-Z0-9]/,
      "La contraseña debe incluir al menos un símbolo especial.",
    ),
});

export type DatosRegistro = z.infer<typeof esquemaRegistro>;

export const esquemaLogin = z.object({
  correo: z
    .string()
    .email("Ingresa un correo electrónico con formato válido."),
  clave: z
    .string()
    .min(1, "La contraseña no puede estar vacía."),
});

export type DatosLogin = z.infer<typeof esquemaLogin>;

export const esquemaCrearPersonaje = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "El nombre del explorador debe tener al menos 3 caracteres."),
  especieInicialSlug: z.enum(
    ["lobo-gris", "pico-de-hacha", "arana-lobo-gigante"],
    {
      errorMap: () => ({
        message: "Debes seleccionar una de las criaturas iniciales.",
      }),
    },
  ),
});

export type DatosCrearPersonaje = z.infer<typeof esquemaCrearPersonaje>;
