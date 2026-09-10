// src/server.js
app.put('/products/:id', async (req, res) => {
  const id = Number(req.params.id)

  // Validação dos campos obrigatórios
  const { nome, preco } = req.body || {}

  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ 
      erro: 'nome é obrigatório e deve ser uma string não vazia' 
    })
  }

  if (preco === undefined || typeof preco !== 'number' || preco <= 0) {
    return res.status(400).json({ 
      erro: 'preco é obrigatório e deve ser um número maior que 0' 
    })
  }

  const products = await readProducts() // ou readUsers se estiver reutilizando
  const idx = products.findIndex(p => p.id === id)

  if (idx === -1) {
    return res.status(404).json({ erro: 'Produto não encontrado' })
  }

  // Substituição completa (mantém o id da URL)
  products[idx] = { 
    id, 
    nome: nome.trim(), 
    preco 
  }

  await writeProducts(products)
  res.json(products[idx]) // 200 OK
})

// Hard delete (remove de verdade do array)
app.delete('/products/:id', async (req, res) => {
  const id = Number(req.params.id)
  const products = await readProducts()
  
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) {
    return res.status(404).json({ erro: 'Produto não encontrado' })
  }

  products.splice(idx, 1)          // remove do array
  await writeProducts(products)
  
  res.status(204).end()            // 204 No Content
})

// Soft delete (marca como removido)
app.delete('/products/:id', async (req, res) => {
  const id = Number(req.params.id)
  const products = await readProducts()
  
  const product = products.find(p => p.id === id)
  if (!product) {
    return res.status(404).json({ erro: 'Produto não encontrado' })
  }
  
  if (product.deletedAt) {
    return res.status(409).json({ erro: 'Produto já foi removido' })
  }

  product.deletedAt = new Date().toISOString()
  await writeProducts(products)
  
  res.status(204).end()
})

// GET /products — só retorna os ativos
app.get('/products', async (req, res) => {
  const products = await readProducts()
  const ativos = products.filter(p => !p.deletedAt)
  res.json(ativos)
})

// Soft delete por padrão + hard delete com ?force=true
app.delete('/products/:id', async (req, res) => {
  const id = Number(req.params.id)
  const force = req.query.force === 'true'   // ?force=true

  const products = await readProducts()
  const idx = products.findIndex(p => p.id === id)

  if (idx === -1) {
    return res.status(404).json({ erro: 'Produto não encontrado' })
  }

  // Hard delete forçado
  if (force) {
    products.splice(idx, 1)
    await writeProducts(products)
    return res.status(204).end()
  }

  // Soft delete (padrão)
  const product = products[idx]
  
  if (product.deletedAt) {
    return res.status(409).json({ erro: 'Produto já foi removido' })
  }

  product.deletedAt = new Date().toISOString()
  await writeProducts(products)
  
  res.status(204).end()
})