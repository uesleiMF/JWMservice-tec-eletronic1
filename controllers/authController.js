const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '15d'
        }
    );
};

// ======================================================
// REGISTER
// ======================================================

exports.register = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            phone,
            role,

            servico,
            especialidade,
            descricao,
            experiencia,

            city,
            state,

            precoInicial,

            latitude,
            longitude

        } = req.body;

        if (!name || !email || !password || !phone || !role) {
            return res.status(400).json({
                message: 'Todos os campos obrigatórios devem ser preenchidos.'
            });
        }

        const emailExists = await User.findOne({
            email: email.toLowerCase()
        });

        if (emailExists) {
            return res.status(400).json({
                message: 'Este e-mail já está cadastrado.'
            });
        }

        const user = new User({

            name,

            email: email.toLowerCase(),

            phone,

            role,

            servico: role === 'profissional' ? servico : undefined,

            especialidade: role === 'profissional' ? especialidade : undefined,

            descricao: role === 'profissional' ? descricao : undefined,

            experiencia: role === 'profissional'
                ? Number(experiencia || 0)
                : undefined,

            city,

            state,

            precoInicial: Number(precoInicial || 0),

            latitude: latitude || undefined,

            longitude: longitude || undefined,

            location:
                latitude && longitude
                    ? {
                          type: 'Point',
                          coordinates: [
                              Number(longitude),
                              Number(latitude)
                          ]
                      }
                    : undefined

        });

        await user.setPassword(password);

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({

            message: 'Usuário cadastrado com sucesso.',

            token,

            user: {

                _id: user._id,

                name: user.name,

                email: user.email,

                phone: user.phone,

                role: user.role,

                servico: user.servico,

                especialidade: user.especialidade,

                city: user.city,

                state: user.state,

                foto: user.foto,

                avaliacaoMedia: user.avaliacaoMedia,

                totalAvaliacoes: user.totalAvaliacoes,

                premium: user.premium,

                verificado: user.verificado

            }

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            message: 'Erro ao cadastrar usuário.',

            error: err.message

        });

    }

};

// ======================================================
// LOGIN
// ======================================================

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({

                message: 'Informe e-mail e senha.'

            });

        }

        const user = await User.findOne({

            email: email.toLowerCase()

        });

        if (!user) {

            return res.status(400).json({

                message: 'Usuário não encontrado.'

            });

        }

        const passwordMatch = await user.validatePassword(password);

        if (!passwordMatch) {

            return res.status(400).json({

                message: 'Senha inválida.'

            });

        }

        const token = generateToken(user._id);

        res.json({

            token,

            user: {

                _id: user._id,

                name: user.name,

                email: user.email,

                phone: user.phone,

                role: user.role,

                servico: user.servico,

                especialidade: user.especialidade,

                descricao: user.descricao,

                experiencia: user.experiencia,

                foto: user.foto,

                city: user.city,

                state: user.state,

                precoInicial: user.precoInicial,

                avaliacaoMedia: user.avaliacaoMedia,

                totalAvaliacoes: user.totalAvaliacoes,

                servicosConcluidos: user.servicosConcluidos,

                favoritos: user.favoritos,

                premium: user.premium,

                verificado: user.verificado,

                isOnline: user.isOnline

            }

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            message: 'Erro interno do servidor.'

        });

    }

};