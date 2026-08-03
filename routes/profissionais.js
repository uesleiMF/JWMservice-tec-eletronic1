const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');



// ======================================================
// LISTAR PROFISSIONAIS ATIVOS
// ======================================================

router.get('/', async (req, res) => {

  try {


    const profissionais = await User.find({

      role: 'profissional',

      status: 'ativo',

      paymentStatus: 'pago'

    })

    .select(
      `
      name
      email
      servico
      especialidade
      phone
      descricao
      experiencia
      foto
      city
      state
      avaliacaoMedia
      totalAvaliacoes
      precoInicial
      verificado
      premium
      isOnline
      location
      `
    )

    .sort({

      premium:-1,

      avaliacaoMedia:-1

    });



    res.json(profissionais);



  } catch(err){


    console.error(
      "ERRO LISTAR PROFISSIONAIS:",
      err
    );


    res.status(500).json({

      message:
      "Erro ao buscar profissionais"

    });


  }

});









// ======================================================
// PROFISSIONAIS PRÓXIMOS
// ======================================================

router.get('/proximos', async(req,res)=>{


try{


const {

latitude,

longitude,

raio = 50000


}=req.query;



if(!latitude || !longitude){


return res.status(400).json({

message:
"Latitude e longitude são obrigatórias"

});


}




const lat = Number(latitude);

const lon = Number(longitude);

const distancia = Number(raio);





if(
Number.isNaN(lat) ||
Number.isNaN(lon)
){


return res.status(400).json({

message:
"Coordenadas inválidas"

});


}




console.log(
"📍 Buscando profissionais:",
{
lat,
lon,
distancia
}
);





let profissionais=[];




// ======================================================
// BUSCA GEO
// ======================================================


try{


profissionais =
await User.find({

role:"profissional",

status:"ativo",

paymentStatus:"pago",


location:{


$near:{


$geometry:{


type:"Point",


coordinates:[

lon,

lat

]


},


$maxDistance:
distancia


}


}


})

.select(

`
name
servico
especialidade
foto
city
state
descricao
experiencia
avaliacaoMedia
totalAvaliacoes
precoInicial
verificado
premium
isOnline
location
`

)

.limit(20);




}catch(geoError){


console.log(

"⚠️ Falha GEO:",
geoError.message

);


}






// ======================================================
// FALLBACK
// ======================================================


if(
!profissionais ||
profissionais.length===0
){


console.log(
"🔎 Usando busca geral..."
);



profissionais =

await User.find({

role:"profissional",

status:"ativo",

paymentStatus:"pago"


})

.select(

`
name
servico
especialidade
foto
city
state
descricao
experiencia
avaliacaoMedia
totalAvaliacoes
precoInicial
verificado
premium
isOnline
location
`

)

.sort({

premium:-1,

avaliacaoMedia:-1

})

.limit(20);



}





console.log(

`✅ ${profissionais.length} profissionais encontrados`

);



res.json(profissionais);





}catch(err){


console.error(

"❌ ERRO PROFISSIONAIS PRÓXIMOS:",
err

);



res.status(500).json({

message:
"Erro ao buscar profissionais próximos",

error:
err.message

});


}


});









// ======================================================
// MEU PERFIL
// ======================================================

router.get('/meu', protect, async(req,res)=>{


try{


const user = await User.findById(

req.user._id

)

.select(

`
name
email
phone
servico
especialidade
descricao
experiencia
foto
city
state
avaliacaoMedia
totalAvaliacoes
precoInicial
portfolio
horarios
diasAtendimento
latitude
longitude
role
status
paymentStatus
`

);



if(!user){


return res.status(404).json({

message:
"Perfil não encontrado"

});


}



res.json(user);



}catch(err){


console.error(

"ERRO MEU PERFIL:",
err

);


res.status(500).json({

message:
"Erro ao buscar perfil"

});


}


});









// ======================================================
// PERFIL PÚBLICO
// ======================================================

router.get('/:id', async(req,res)=>{


try{


const profissional =

await User.findOne({

_id:req.params.id,

role:"profissional",

status:"ativo",

paymentStatus:"pago"


})

.select(

`
name
email
phone
servico
especialidade
descricao
experiencia
foto
city
state
avaliacaoMedia
totalAvaliacoes
precoInicial
portfolio
horarios
diasAtendimento
raioAtendimento
verificado
premium
servicosConcluidos
favoritos
instagram
facebook
site
location
`

);





if(!profissional){


return res.status(404).json({

message:
"Profissional não encontrado"

});


}




res.json(profissional);



}catch(err){


console.error(

"ERRO PERFIL:",
err

);



res.status(500).json({

message:
"Erro ao buscar profissional"

});


}


});









// ======================================================
// ATUALIZAR PERFIL PROFISSIONAL
// ======================================================

router.put('/meu',protect,async(req,res)=>{


try{


const camposPermitidos=[


'name',

'phone',

'servico',

'especialidade',

'descricao',

'experiencia',

'city',

'state',

'foto',

'precoInicial',

'raioAtendimento',

'horarios',

'diasAtendimento',

'instagram',

'facebook',

'site'


];



const dados={};



camposPermitidos.forEach(c=>{


if(req.body[c] !== undefined){


dados[c]=req.body[c];


}


});






const user =

await User.findOneAndUpdate(

{

_id:req.user._id,

role:"profissional"

},

{

$set:dados

},

{

new:true,

runValidators:true

}

);





if(!user){


return res.status(404).json({

message:
"Usuário não encontrado"

});


}





res.json({

message:
"Perfil atualizado com sucesso",

user

});





}catch(err){


console.error(

"ERRO ATUALIZAR PERFIL:",
err

);



res.status(500).json({

message:
"Erro ao atualizar perfil"

});


}


});









// ======================================================
// CONFIRMAR PAGAMENTO PROFISSIONAL
// ======================================================

router.put('/:id/pagamento',async(req,res)=>{


try{


const profissional =

await User.findOneAndUpdate(

{

_id:req.params.id,

role:"profissional"

},

{


status:"ativo",

paymentStatus:"pago",

verificado:true,

registrationFeePaidAt:
new Date()


},

{

new:true

}

);






if(!profissional){


return res.status(404).json({

success:false,

message:
"Profissional não encontrado"

});


}





res.json({

success:true,

message:
"Pagamento confirmado com sucesso",

profissional

});





}catch(err){


console.error(

"ERRO PAGAMENTO:",
err

);



res.status(500).json({

success:false,

message:
"Erro ao confirmar pagamento"

});


}


});






module.exports = router;