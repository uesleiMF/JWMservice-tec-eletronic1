const mongoose = require('mongoose');


const ConversationSchema = new mongoose.Schema(

{

    // ==========================================
    // PARTICIPANTES
    // ==========================================

    participants: [

        {

            type: mongoose.Schema.Types.ObjectId,

            ref: 'User',

            required: true

        }

    ],



    // ==========================================
    // CLIENTE E PROFISSIONAL
    // (facilita identificar no chat)
    // ==========================================


    client: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'User',

        default: null

    },



    profissional: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'User',

        default: null

    },




    // ==========================================
    // PEDIDO RELACIONADO
    // ==========================================


    order: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'Order',

        default: null

    },



    orderId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'Order',

        default: null

    },





    // ==========================================
    // ÚLTIMA MENSAGEM
    // ==========================================


    lastMessage: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'Message',

        default: null

    },


    lastMessageAt: {

        type: Date,

        default: Date.now

    },






    // ==========================================
    // STATUS
    // ==========================================


    status: {

        type:String,

        enum:[

            'active',

            'closed',

            'archived',

            'blocked'

        ],

        default:'active'

    },






    // ==========================================
    // MENSAGENS NÃO LIDAS
    // ==========================================


    unreadCount:{


        type:Map,

        of:Number,

        default:()=>new Map()


    },







    // ==========================================
    // EXCLUSÃO PARA USUÁRIO
    // ==========================================


    deletedFor:[


        {

            type:mongoose.Schema.Types.ObjectId,

            ref:'User'


        }


    ],






    // ==========================================
    // BLOQUEIO
    // ==========================================


    isBlocked:{


        type:Boolean,

        default:false


    },


    blockedBy:{


        type:mongoose.Schema.Types.ObjectId,

        ref:'User',

        default:null


    },






    // ==========================================
    // METADADOS
    // ==========================================


    metadata:{


        createdBy:{


            type:mongoose.Schema.Types.ObjectId,

            ref:'User',

            default:null


        },



        source:{


            type:String,


            enum:[

                'manual',

                'order',

                'system'

            ],


            default:'order'


        }



    }



},


{

    timestamps:true

}

);







// ==========================================
// ÍNDICES
// ==========================================


ConversationSchema.index({

    participants:1

});


ConversationSchema.index({

    orderId:1

});


ConversationSchema.index({

    order:1

});


ConversationSchema.index({

    lastMessageAt:-1

});


ConversationSchema.index({

    status:1

});



ConversationSchema.index({

    participants:1,

    lastMessageAt:-1

});








// ==========================================
// MÉTODOS
// ==========================================


ConversationSchema.methods.incrementUnread = function(userId){


const atual =

this.unreadCount.get(

String(userId)

)

||0;



this.unreadCount.set(

String(userId),

atual+1

);



};






ConversationSchema.methods.clearUnread=function(userId){


this.unreadCount.set(

String(userId),

0

);


};






ConversationSchema.methods.hideForUser=function(userId){


if(

!this.deletedFor.some(

id=>

id.toString()===userId.toString()

)

){


this.deletedFor.push(userId);


}


};






ConversationSchema.methods.blockConversation=function(userId){


this.isBlocked=true;

this.blockedBy=userId;

this.status='blocked';


};






ConversationSchema.methods.unblockConversation=function(){


this.isBlocked=false;

this.blockedBy=null;

this.status='active';


};








module.exports =
mongoose.model(

'Conversation',

ConversationSchema

);