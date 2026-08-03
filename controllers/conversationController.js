const Conversation = require('../models/Conversation');
const Message = require('../models/Message');



// ======================================================
// LISTAR CONVERSAS DO USUÁRIO
// ======================================================

exports.getConversations = async (req, res) => {

    try {


        const userId = req.user._id;



        const conversations = await Conversation.find({

            participants: {
                $in: [userId]
            }

        })


        .populate(
            'participants',
            'name email phone foto role'
        )


        .populate(
            'order'
        )


        .sort({

            lastMessageAt: -1

        });





        console.log(
            "💬 Conversas encontradas:",
            conversations.length
        );




        res.json({

            conversations

        });



    } catch (err) {


        console.error(
            "❌ Erro ao listar conversas:",
            err
        );


        res.status(500).json({

            message:
            "Erro ao carregar conversas"

        });


    }

};









// ======================================================
// BUSCAR UMA CONVERSA PELO ID
// ======================================================

exports.getConversationById = async (req, res) => {


    try {


        const {
            id
        } = req.params;



        const userId =
        req.user._id;





        const conversation = await Conversation.findById(id)


        .populate(
            'participants',
            'name email phone foto role'
        )


        .populate(
            'order'
        );







        if (!conversation) {


            return res.status(404).json({

                message:
                "Conversa não encontrada"

            });


        }







        const autorizado =

        conversation.participants.some(

            participant =>

            String(participant._id)

            ===

            String(userId)

        );







        if (!autorizado) {


            return res.status(403).json({

                message:
                "Acesso negado a esta conversa"

            });


        }







        res.json({

            conversation

        });





    } catch (err) {


        console.error(

            "❌ Erro buscar conversa:",
            err

        );



        res.status(500).json({

            message:
            "Erro interno"

        });



    }


};









// ======================================================
// BUSCAR MENSAGENS DA CONVERSA
// ======================================================

exports.getMessages = async (req,res)=>{


    try {



        const conversationId =
        req.params.id;



        const userId =
        req.user._id;





        console.log(

            "🔍 [getMessages]",
            "Conv:",
            conversationId,
            "| User:",
            userId

        );







        const conversation = await Conversation.findById(
            conversationId
        );






        if(!conversation){


            return res.status(404).json({

                message:
                "Conversa não encontrada"

            });


        }







        const participa =

        conversation.participants.some(

            id =>

            String(id)

            ===

            String(userId)

        );







        if(!participa){


            return res.status(403).json({

                message:
                "Usuário não participa desta conversa"

            });


        }









        const messages = await Message.find({

            conversationId

        })


        .sort({

            createdAt:1

        });







        console.log(

            "✅ Mensagens encontradas:",
            messages.length

        );







        res.json({

            messages

        });








    } catch(err){


        console.error(

            "❌ Erro mensagens:",
            err

        );



        res.status(500).json({

            message:
            "Erro ao buscar mensagens"

        });



    }



};









// ======================================================
// CRIAR CONVERSA MANUALMENTE
// ======================================================

exports.createConversation = async(req,res)=>{


    try {


        const {

            clientId,

            profissionalId,

            orderId


        } = req.body;







        if(
            !clientId ||
            !profissionalId
        ){


            return res.status(400).json({

                message:
                "Cliente e profissional obrigatórios"

            });


        }







        let conversation = await Conversation.findOne({

            participants:{

                $all:[

                    clientId,

                    profissionalId

                ]

            }

        });








        if(conversation){



            conversation = await Conversation.findById(
                conversation._id
            )


            .populate(

                'participants',

                'name email phone foto role'

            );




            return res.json({

                conversation

            });



        }









        conversation = await Conversation.create({



            participants:[

                clientId,

                profissionalId

            ],



            client:clientId,



            profissional:profissionalId,



            order:orderId || null,



            orderId:orderId || null,



            lastMessageAt:new Date()



        });







        conversation = await Conversation.findById(

            conversation._id

        )


        .populate(

            'participants',

            'name email phone foto role'

        );









        console.log(

            "🆕 Conversa criada:",
            conversation._id

        );







        res.status(201).json({


            success:true,


            conversation


        });







    } catch(err){



        console.error(

            "❌ Erro criar conversa:",
            err

        );



        res.status(500).json({

            message:
            "Erro ao criar conversa"

        });



    }



};