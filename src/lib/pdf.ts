import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Orcamento, OrcamentoEtapa, OrcamentoInsumo } from './types';

const NAVY: [number, number, number] = [8, 39, 84];
const GOLD: [number, number, number] = [197, 162, 106];
const LIGHT_BG: [number, number, number] = [245, 243, 238];
const GRAY: [number, number, number] = [101, 115, 134];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function addHeader(doc: jsPDF, orcamento: Orcamento) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CONCEPT EMPREENDIMENTOS', 14, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GOLD);
  doc.text('Arquitetura que permanece', 14, 21);
  doc.setTextColor(200, 210, 220);
  doc.setFontSize(7);
  doc.text('contato@conceptempreendimentos.com.br  |  +55 11 98888 2200  |  São Paulo, Brasil', 14, 28);

  doc.setTextColor(...NAVY);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(orcamento.status === 'Aprovado' ? 'Proposta Aprovada' : 'Proposta de Orçamento', 14, 48);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Data: ${formatDate(orcamento.created_at)}`, 14, 54);
  if (orcamento.criado_por_nome) {
    doc.text(`Responsável: ${orcamento.criado_por_nome}`, 14, 59);
  }
}

function addClientInfo(doc: jsPDF, orcamento: Orcamento, startY: number): number {
  autoTable(doc, {
    startY,
    head: [['DADOS DO CLIENTE', '']],
    body: [
      ['Cliente', orcamento.cliente_nome || '—'],
      ['Telefone', orcamento.cliente_telefone || '—'],
      ['E-mail', orcamento.cliente_email || '—'],
      ['Endereço da obra', orcamento.endereco_obra || '—'],
      ['Tipo de obra', orcamento.tipo_obra],
      ['Área total', `${orcamento.area_total} m²`],
      ['Padrão construtivo', orcamento.padrao],
      ['Prazo de execução', `${orcamento.prazo_meses} meses`],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [40, 50, 60] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: LIGHT_BG } },
    margin: { left: 14, right: 14 },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function addEtapasTable(doc: jsPDF, etapas: OrcamentoEtapa[], startY: number): number {
  autoTable(doc, {
    startY,
    head: [['ETAPA', 'DURAÇÃO', 'VALOR']],
    body: etapas.map((e) => [
      e.nome,
      `${e.duracao_meses} mês(es)`,
      formatCurrency(e.valor),
    ]),
    theme: 'striped',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [40, 50, 60] },
    alternateRowStyles: { fillColor: [248, 247, 242] },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 'auto', halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function addCronograma(doc: jsPDF, etapas: OrcamentoEtapa[], prazoMeses: number, startY: number): number {
  const months = Math.max(prazoMeses, etapas.reduce((s, e) => s + e.duracao_meses, 0));
  const monthCols: string[] = [];
  for (let i = 1; i <= months; i++) monthCols.push(`M${i}`);

  const head = [['ETAPA', ...monthCols]];
  const body = etapas.map((e) => {
    const row: string[] = [e.nome];
    let cumulative = 0;
    for (let m = 1; m <= months; m++) {
      if (cumulative < m && cumulative + e.duracao_meses >= m) {
        row.push('█');
      } else {
        row.push('');
      }
    }
    return row;
  });

  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 6, halign: 'center' },
    bodyStyles: { fontSize: 6, textColor: [40, 50, 60] },
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function addValorTotal(doc: jsPDF, orcamento: Orcamento, startY: number): number {
  const valorComBDI = orcamento.valor_total * (1 + orcamento.bdi_percent / 100);
  autoTable(doc, {
    startY,
    body: [
      ['Valor base da obra', formatCurrency(orcamento.valor_total)],
      ...(orcamento.bdi_percent > 0
        ? [[`BDI/Lucro (${orcamento.bdi_percent}%)`, formatCurrency(orcamento.valor_total * orcamento.bdi_percent / 100)]]
        : []),
      ['VALOR TOTAL DA OBRA', formatCurrency(valorComBDI)],
    ],
    theme: 'plain',
    bodyStyles: { fontSize: 10, textColor: [40, 50, 60] },
    columnStyles: {
      0: { cellWidth: 130, halign: 'right' },
      1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function addCondicoes(doc: jsPDF, startY: number) {
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  const condicoes = [
    'CONDIÇÕES GERAIS',
    '1. Esta proposta tem validade de 30 dias a partir da data de emissão.',
    '2. O cronograma de execução está sujeito a ajustes conforme condições climáticas e aprovações.',
    '3. O valor total pode sofrer reajuste conforme variações de custo de materiais e mão de obra.',
    '4. Condições de pagamento a serem definidas em contrato específico.',
    '',
    'Concept Empreendimentos · CNPJ sob consulta · São Paulo, Brasil',
  ];
  let y = startY + 8;
  condicoes.forEach((linha, i) => {
    if (i === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
    }
    doc.text(linha, 14, y);
    y += 4;
  });
}

export function generateClientPDF(orcamento: Orcamento, etapas: OrcamentoEtapa[]) {
  const doc = new jsPDF();
  addHeader(doc, orcamento);
  let y = addClientInfo(doc, orcamento, 65);
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Etapas da Obra', 14, y);
  y = addEtapasTable(doc, etapas, y + 4);
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Cronograma Físico-Financeiro', 14, y);
  y = addCronograma(doc, etapas, orcamento.prazo_meses, y + 4);
  y += 10;
  y = addValorTotal(doc, orcamento, y);
  addCondicoes(doc, y);

  doc.save(`Orcamento_Cliente_${orcamento.cliente_nome.replace(/\s+/g, '_')}.pdf`);
}

export function generateFuncionarioPDF(
  orcamento: Orcamento,
  etapas: OrcamentoEtapa[],
  insumos: OrcamentoInsumo[]
) {
  const doc = new jsPDF();
  addHeader(doc, orcamento);

  doc.setFillColor(...GOLD);
  doc.rect(180, 8, 25, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERNO', 183, 12);

  let y = addClientInfo(doc, orcamento, 65);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('PARÂMETROS DE CÁLCULO', 14, y);
  autoTable(doc, {
    startY: y + 2,
    body: [
      ['CUB/m² (padrão)', formatCurrency(orcamento.cub_m2)],
      ['Área total', `${orcamento.area_total} m²`],
      ['Valor base calculado', formatCurrency(orcamento.area_total * orcamento.cub_m2)],
      ['BDI/Lucro', `${orcamento.bdi_percent}%`],
      ['Valor com BDI', formatCurrency(orcamento.valor_total * (1 + orcamento.bdi_percent / 100))],
    ],
    theme: 'grid',
    bodyStyles: { fontSize: 7, textColor: [40, 50, 60] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, fillColor: LIGHT_BG } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('ETAPAS DA OBRA', 14, y);
  y = addEtapasTable(doc, etapas, y + 2);
  y = addValorTotal(doc, orcamento, y + 4);

  if (insumos.length > 0) {
    doc.addPage();
    addHeader(doc, orcamento);
    y = 48;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('COMPOSIÇÃO DETALHADA DE INSUMOS', 14, y);
    y += 4;

    const grouped = insumos.reduce<Record<string, OrcamentoInsumo[]>>((acc, item) => {
      (acc[item.etapa_nome] = acc[item.etapa_nome] || []).push(item);
      return acc;
    }, {});

    for (const [etapaNome, items] of Object.entries(grouped)) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GOLD);
      doc.text(etapaNome, 14, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [['Descrição', 'Tipo', 'Un.', 'Qtd.', 'Custo Unit.', 'Custo Total']],
        body: items.map((i) => [
          i.descricao,
          i.tipo,
          i.unidade,
          i.quantidade.toString(),
          formatCurrency(i.custo_unitario),
          formatCurrency(i.custo_total),
        ]),
        theme: 'striped',
        headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 6 },
        bodyStyles: { fontSize: 6, textColor: [40, 50, 60] },
        alternateRowStyles: { fillColor: [248, 247, 242] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 22 },
          2: { cellWidth: 12, halign: 'center' },
          3: { cellWidth: 18, halign: 'right' },
          4: { cellWidth: 28, halign: 'right' },
          5: { cellWidth: 'auto', halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }

    const totalInsumos = insumos.reduce((s, i) => s + i.custo_total, 0);
    autoTable(doc, {
      startY: y,
      body: [['TOTAL DE INSUMOS', formatCurrency(totalInsumos)]],
      theme: 'plain',
      bodyStyles: { fontSize: 9, textColor: NAVY, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 130, halign: 'right' },
        1: { cellWidth: 'auto', halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  addCondicoes(doc, (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10);

  doc.save(`Orcamento_Funcionario_${orcamento.cliente_nome.replace(/\s+/g, '_')}.pdf`);
}
