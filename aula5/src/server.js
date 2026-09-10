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