import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Bússola"

interface ConsultoriaReportProps {
  htmlContent?: string
}

const ConsultoriaReportEmail = ({ htmlContent }: ConsultoriaReportProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Relatório de Consultoria Pedagógica - {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>Relatório de Consultoria Pedagógica</Heading>
          <Text style={subtitle}>{SITE_NAME}</Text>
        </Section>
        {htmlContent ? (
          <Section
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <Text style={text}>Nenhum dado disponível para o período selecionado.</Text>
        )}
        <Text style={footer}>Este relatório foi gerado automaticamente pelo sistema {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ConsultoriaReportEmail,
  subject: 'Relatório de Consultoria Pedagógica',
  displayName: 'Relatório de Consultoria Pedagógica',
  previewData: {
    htmlContent: '<p>Exemplo de relatório com dados de consultoria.</p>',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '680px' }
const headerSection = { borderBottom: '2px solid #1a3a5c', paddingBottom: '16px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a3a5c', margin: '0 0 8px' }
const subtitle = { fontSize: '14px', color: '#666666', margin: '0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', borderTop: '1px solid #eee', paddingTop: '16px' }
