import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DREData } from '@/lib/types'
import { formatCurrency, MONTHS, groupByExpenseName, pctOf } from '@/lib/utils'

// jspdf-autotable anexa `lastAutoTable` na instância do doc, mas o tipo não vem tipado por padrão.
interface DocWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number }
}

const MARGIN = 14
const PAGE_BOTTOM_LIMIT = 280 // A4 tem ~297mm de altura; deixa margem pro rodapé

function ensureSpace(doc: DocWithAutoTable, cursorY: number, needed = 20): number {
  if (cursorY + needed > PAGE_BOTTOM_LIMIT) {
    doc.addPage()
    return MARGIN
  }
  return cursorY
}

function addSectionTitle(doc: DocWithAutoTable, title: string, cursorY: number): number {
  cursorY = ensureSpace(doc, cursorY, 14)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text(title, MARGIN, cursorY)
  return cursorY + 5
}

export function generateDrePdf(dreData: DREData, month: number, year: number) {
  const doc = new jsPDF() as DocWithAutoTable
  const pageWidth = doc.internal.pageSize.getWidth()

  // Cabeçalho
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text('Demonstrativo de Resultado (DRE)', MARGIN, 18)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(90, 90, 90)
  doc.text(`Competência: ${MONTHS[month - 1]} ${year}`, MARGIN, 25)

  const generatedAt = new Date().toLocaleString('pt-BR')
  doc.setFontSize(8)
  doc.text(`Gerado em ${generatedAt}`, pageWidth - MARGIN, 25, { align: 'right' })

  let cursorY = 34

  // Receita Bruta
  cursorY = addSectionTitle(doc, 'Receita Bruta', cursorY)
  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Descrição', 'Valor', '%']],
    body: [['Valor Total', formatCurrency(dreData.revenue), '100%']],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [22, 163, 74] }, // verde
  })
  cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 8

  // Resultado do Estoque/CMV (3 formas)
  cursorY = addSectionTitle(doc, 'Resultado do Estoque/CMV', cursorY)
  const results = [dreData.stockResults.cashFlow, dreData.stockResults.cmvPurchased, dreData.stockResults.cmvTarget]
  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Forma de Resultado', 'Resultado', '%']],
    body: results.map((r) => [r.label, formatCurrency(r.result), `${r.percentOfRevenue.toFixed(2)}%`]),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 65, 81] }, // cinza escuro
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const value = results[data.row.index]?.result ?? 0
        data.cell.styles.textColor = value >= 0 ? [22, 163, 74] : [220, 38, 38]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })
  cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 5

  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text(`Outras despesas (exceto Estoque): ${formatCurrency(dreData.otherExpensesTotal)}`, MARGIN, cursorY)
  cursorY += 9

  const inventoryCategory = dreData.categories.find((c) => c.is_inventory) ?? null
  const otherCategories = dreData.categories.filter((c) => !c.is_inventory)

  // Card especial de Estoque, com os fornecedores + as 3 métricas
  if (inventoryCategory) {
    cursorY = addSectionTitle(doc, `${inventoryCategory.category_name} (Estoque/CMV)`, cursorY)

    const details = groupByExpenseName(inventoryCategory.expenses)
    const body: (string | number)[][] = details.map(([, g]) => [
      g.count > 1 ? `${g.name} (${g.count}×)` : g.name,
      formatCurrency(g.total),
      pctOf(g.total, dreData.revenue),
    ])
    body.push(['(-) Estoque Pago (Fluxo de Caixa)', formatCurrency(dreData.stockPaid), pctOf(dreData.stockPaid, dreData.revenue)])
    body.push(['(-) Estoque Comprado (informado)', formatCurrency(dreData.stockPurchased), pctOf(dreData.stockPurchased, dreData.revenue)])
    body.push([`Meta % CMV (${dreData.cmvTargetPercent.toFixed(2)}%)`, formatCurrency(dreData.cmvTargetValue), `${dreData.cmvTargetPercent.toFixed(2)}%`])

    const totalRowsStart = body.length - 3

    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Fornecedor / Métrica', 'Valor', '%']],
      body,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [234, 88, 12] }, // laranja
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index >= totalRowsStart) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [255, 247, 237]
        }
      },
    })
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 8
  }

  // Demais categorias
  for (const cat of otherCategories) {
    cursorY = addSectionTitle(doc, cat.category_name, cursorY)
    const details = groupByExpenseName(cat.expenses)
    const body: (string | number)[][] = details.map(([, g]) => [
      g.count > 1 ? `${g.name} (${g.count}×)` : g.name,
      formatCurrency(g.total),
      pctOf(g.total, dreData.revenue),
    ])
    body.push(['(=) Deduções', formatCurrency(cat.total), pctOf(cat.total, dreData.revenue)])

    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Fornecedor', 'Valor', '%']],
      body,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [55, 65, 81] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [249, 250, 251]
        }
      },
    })
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 8
  }

  // Numeração de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - MARGIN, 292, { align: 'right' })
  }

  doc.save(`DRE_${MONTHS[month - 1]}_${year}.pdf`)
}
