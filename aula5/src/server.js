import express from 'express'
import {
  readProducts,
  writeProducts,
  readUsers,
  writeUsers
} from './db.js'

const app = express()

app.use(express.json())

app.get('/products', async (req, res) => {
  let products = await readProducts()

  const { min } = req.query

  if (min) {
    products = products.filter(
      product => product.preco >= Number(min)
    )
  }

  res.json(products)
})

app.get('/products/:id', async (req, res) => {
  const products = await readProducts()

  const product = products.find(
    product => product.id === Number(req.params.id)
  )

  if (!product) {
    return res.status(404).json({
      erro: 'Produto não encontrado'
    })
  }

  res.json(product)
})

app.post('/products', async (req, res) => {
  const { nome, preco } = req.body || {}

  if (!nome || typeof nome !== 'string') {
    return res.status(400).json({
      erro: 'nome é obrigatório'
    })
  }

  if (preco === undefined || typeof preco !== 'number') {
    return res.status(400).json({
      erro: 'preco é obrigatório e deve ser um número'
    })
  }

  const products = await readProducts()

  const novoId = products.length
    ? Math.max(...products.map(product => product.id)) + 1
    : 1

  const novoProduto = {
    id: novoId,
    nome,
    preco
  }

  products.push(novoProduto)

  await writeProducts(products)

  res.status(201).json(novoProduto)
})

app.post('/users', async (req, res) => {
  const { nome, email } = req.body || {}

  if (!nome || typeof nome !== 'string') {
    return res.status(400).json({
      erro: 'nome é obrigatório'
    })
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      erro: 'email inválido'
    })
  }

  const users = await readUsers()

  const emailExiste = users.some(
    user => user.email === email
  )

  if (emailExiste) {
    return res.status(409).json({
      erro: 'Email já cadastrado'
    })
  }

  const novoId = users.length
    ? Math.max(...users.map(user => user.id)) + 1
    : 1

  const novoUsuario = {
    id: novoId,
    nome,
    email
  }

  users.push(novoUsuario)

  await writeUsers(users)

  res.status(201).json(novoUsuario)
})

app.post('/users/batch', async (req, res) => {
  const novosUsuarios = req.body

  if (!Array.isArray(novosUsuarios)) {
    return res.status(400).json({
      erro: 'O body deve ser um array de usuários'
    })
  }

  const users = await readUsers()

  const emailsExistentes = new Set(
    users.map(user => user.email)
  )

  for (const usuario of novosUsuarios) {
    if (
      !usuario.nome ||
      typeof usuario.nome !== 'string'
    ) {
      return res.status(400).json({
        erro: 'Todos os usuários devem possuir nome'
      })
    }

    if (
      !usuario.email ||
      !usuario.email.includes('@')
    ) {
      return res.status(400).json({
        erro: 'Todos os usuários devem possuir email válido'
      })
    }

    if (emailsExistentes.has(usuario.email)) {
      return res.status(409).json({
        erro: `Email já cadastrado: ${usuario.email}`
      })
    }

    emailsExistentes.add(usuario.email)
  }

  let proximoId = users.length
    ? Math.max(...users.map(user => user.id)) + 1
    : 1

  const usuariosCriados = novosUsuarios.map(usuario => {
    const novoUsuario = {
      id: proximoId++,
      nome: usuario.nome,
      email: usuario.email
    }

    users.push(novoUsuario)

    return novoUsuario
  })

  await writeUsers(users)

  res.status(201).json(usuariosCriados)
})

app.listen(3000, () => {
  console.log('API rodando em :3000')
})