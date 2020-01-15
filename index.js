const express = require('express')
const app = express()
const sqlite = require('sqlite')

const dbConnection = sqlite.open('banco.sqlite', { Promise })
const bodyParser = require('body-parser')

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', async (request, response) => {

    const db = await dbConnection
    const categoriasDb = await db.all('select * from categorias;')
    const vagas = await db.all('select *from vagas;')

    const categorias = categoriasDb.map(cat => {
        return {
            ...cat,
            vagas: vagas.filter(vaga => vaga.categoria === cat.id)
        }
    })

    response.render('Home', {
        categorias
    })
})

app.get('/vaga/:id', async (req, res) => {
    const db = await dbConnection
    const vaga = await db.get('select * from vagas where id = ' + req.params.id)

    res.render('Vaga', {
        vaga
    })
})

app.get('/admin', (req, res) => {
    res.render('admin/Home')
})

app.get('/admin/vagas', async (req, res) => {
    const db = await dbConnection
    const vagas = await db.all('select * from vagas;')
    res.render('admin/vagas', { vagas })
})

app.get('/admin/vagas/delete/:id', async (req, res) => {
    const db = await dbConnection
    await db.run('delete from vagas where id=' + req.params.id)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async (req, res) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    res.render('admin/Nova-Vaga', { categorias })
})

app.get('/admin/vagas/editar/:id', async (req, res) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    const vaga = await db.get('select * from vagas where id=' + req.params.id)
    res.render('admin/Editar-Vaga', { categorias, vaga })
})

app.post('/admin/vagas/nova', async (req, res) => {
    const { titulo, descricao, categoria } = req.body
    const db = await dbConnection
    await db.run(`insert into vagas (categoria, titulo, descricao) values ('${categoria}', '${titulo}', '${descricao}');`)
    res.redirect('/admin/vagas')
})

app.post('/admin/vagas/editar/:id', async (req, res) => {
    const { titulo, descricao, categoria } = req.body
    const { id } = req.params
    const db = await dbConnection
    await db.run(`update vagas set categoria='${categoria}', titulo = '${titulo}', descricao = '${descricao}' where id=${id};`)
    res.redirect('/admin/vagas')
})

const init = async () => {
    const db = await dbConnection
    await db.run('create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);')
    await db.run('create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);')
}

init()

app.listen(3000, (err) => {
    if (err) {
        console.log(err)
    } else {
        console.log('Servidor rodando..')
    }
})
