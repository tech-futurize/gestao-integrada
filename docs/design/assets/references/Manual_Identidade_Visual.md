# MANUAL DE IDENTIDADE VISUAL E MARCA

## 1. Identidade Estratégica
A SYNTRIA nasceu para elevar o padrão de excelência na construção industrial, conectando o DNA da engenharia ao Core da tecnologia. Eliminamos silos operacionais e ruídos para garantir previsibilidade total.

### Missão
Transformar a complexidade da infraestrutura em resultados previsíveis através de inteligência aplicada, garantindo eficiência máxima conectando a prática de campo com a inovação tecnológica.

### Visão
Ser a empresa com o maior impacto gerado na construção industrial, elevando a produtividade do setor e formando um novo padrão de excelência para empresas.

### Valores
* **Inovação Pragmática:** Conectada à experiência de campo.
* **Sentimento de Dono:** Decisões focadas no nível máximo de qualidade.
* **Transparência:** Comunicação aberta para assegurar confiança.
* **Humildade e Colaboração:** Aprendizado contínuo com cada cliente.

---

## 2. Paleta Cromática

### Primária e Neutra
* **Azul Cobalto:** `#102A44`
* **Ciano Elétrico:** `#26FFFF`
* **Deep Navy (Neutra):** `#0A1929`

### Contraste e Apoio
* **Cinza Titânio:** `#8195A9`
* **Ocre (Contraste 1):** `#a98743`
* **Magenta (Contraste 2):** `#db4974`

---

## 3. Tipografia

### Principal: Inter
> `ABCDEFGHIJKLMnopqrstuvwxyz 1234567890`

Utilizada para cabeçalhos, títulos e interface de software (SaaS). Focada em modernidade e legibilidade técnica.

### Auxiliar: Montserrat
> `ABCDEFGHIJKLMnopqrstuvwxyz 1234567890`

Utilizada em apresentações comerciais e materiais de marketing. Oferece um visual geométrico e amigável.

### Variação: Roboto
> `ABCDEFGHIJKLMnopqrstuvwxyz 1234567890`

Utilizada para textos técnicos e grandes blocos de informação devido à sua eficiência em telas.

---

## 4. Diretrizes de Comunicação
O tom de voz da SYNTRIA é especialista, direto e orientado a dados. Não utilizamos jargões desnecessários; focamos na solução de problemas complexos.

**Regras de Escrita:**
* Use negrito estrategicamente em palavras-chave dentro de títulos.
* Destaque dados e métricas críticas (KPIs) para facilitar a escaneabilidade.
* Mantenha as descrições técnicas diretas ao ponto, eliminando silos de informação.

---

## 5. Diretrizes de Interface e Experiência (UI/UX)
A interface dos sistemas da SYNTRIA deve refletir nossa inovação pragmática, focando em eliminar ruídos visuais e garantir foco absoluto nos dados. O layout prioriza o modo escuro (Dark Theme) para reduzir a fadiga visual e destacar informações críticas.

### 5.1. Profundidade e Hierarquia Visual (Sistema Monocromático)
A sensação de profundidade não utiliza sombras esfumaçadas extensas, mas sim uma sobreposição em camadas baseada em nossa paleta oficial:
* **Background Base (Nível 0 - Fundo da Tela):** Utiliza-se a cor neutra **Deep Navy (`#0A1929`)** para representar a camada mais profunda e distante da interface.
* **Superfícies (Nível 1 - Cards, Painéis e Containers):** Aplicamos a cor primária **Azul Cobalto (`#102A44`)**. Este leve contraste faz com que os blocos de informação se destaquem do fundo sem agredir a visão.
* **Bordas, Divisórias e Filetes:** Para separar elementos dentro dos containers sem criar silos operacionais rígidos, usamos bordas de 1px na cor terciária **Cinza Titânio (`#8195A9`)** com baixa opacidade (ex: 15% a 20%). Isso proporciona uma sensação tátil e estruturada aos painéis.

### 5.2. Aplicação Tipográfica na Interface
A hierarquia da informação deve ser rigorosamente respeitada através das famílias tipográficas escolhidas:
* **Títulos, Módulos e KPIs Principais:** Utiliza-se a fonte principal **Inter**. Emprega-se o negrito estrategicamente para destacar dados e métricas críticas (KPIs), formatados na cor branca ou no **Ciano Elétrico (`#26FFFF`)** para máximo destaque.
* **Tabelas, Listas e Blocos de Dados Técnicos:** Aplica-se a fonte variação **Roboto**, ideal para leitura de grandes blocos de informação em telas. Os rótulos das colunas e textos auxiliares devem utilizar o **Cinza Titânio (`#8195A9`)** para não competir com os dados principais.

### 5.3. Sistema de Cores e Efeito "Neon" (Status Semântico)
Para direcionar a atenção do usuário aos problemas complexos, o efeito luminoso ("aceso") é reservado estritamente para os indicadores de status, utilizando as cores de contraste da marca:

* **Ativo / Positivo / Destaque (Glow Principal):** Utiliza a cor secundária **Ciano Elétrico (`#26FFFF`)**.
    * *Uso:* Indicadores de progresso saudável, metas alcançadas ou seleções ativas.
    * *Efeito CSS (Bola acesa):* Fundo sólido `#26FFFF` com sombra externa `box-shadow: 0 0 10px rgba(38, 255, 255, 0.6)`.
* **Atenção / Em Andamento (Glow Secundário):** Utiliza a cor de Contraste 1, **Ocre (`#a98743`)**.
    * *Uso:* Tarefas em execução, desvios aceitáveis ou pontos de atenção.
    * *Efeito CSS (Bola acesa):* Fundo sólido `#a98743` com sombra externa `box-shadow: 0 0 10px rgba(169, 135, 67, 0.6)`.
* **Alerta Crítico / Atraso (Glow de Risco):** Utiliza a cor de Contraste 2, **Magenta (`#db4974`)**.
    * *Uso:* Gargalos, atrasos críticos ou erros que necessitam de intervenção.
    * *Efeito CSS (Bola acesa):* Fundo sólido `#db4974` com sombra externa `box-shadow: 0 0 10px rgba(219, 73, 116, 0.6)`.

**Construção dos Badges de Status (Pílulas):**
Para manter a elegância técnica, as tags ou badges inseridos em tabelas não devem ser blocos de cor sólida. Eles devem ser construídos com um fundo semi-transparente da cor correspondente (aprox. 15% de opacidade), uma borda fina de 1px em cor sólida e o texto na respectiva cor semântica (Ciano, Ocre ou Magenta). Isso garante a escaneabilidade sem sobrecarregar a interface visualmente.