# Vídeo cinematográfico do hero

## Estado da geração

O vídeo **não foi gerado**. Após o pedido seguinte do usuário, a arte estática foi substituída por contornos animados e um carro ilustrativo. A landing atual não contém vídeo nem controlador de scroll-scrub. Este documento preserva a consulta anterior e o prompt para uma eventual retomada.

Na verificação feita pelo plugin Higgsfield durante esta implementação:

- Seedance 2.5 (`seedance_2_5`) consta no catálogo e aceita imagem inicial, duração de 8 segundos, proporção 21:9 e saída sem áudio.
- Plano consultado: `free`; saldo disponível: **1,55 créditos**.
- Estimativa para 8 segundos, 21:9, 1080p, sem áudio e bitrate alto: **96 créditos**.
- O trial está pendente e não há gerações unlimited disponíveis. As gratuidades apresentadas pertencem a Genjutsu e Viral, não a Seedance 2.5.
- Nenhuma geração foi enviada, nenhum crédito foi gasto, nenhum trial foi iniciado e nenhuma assinatura ou compra foi feita.

O orçamento insuficiente determinou o uso do fallback autorizado pelo usuário. O modelo não foi substituído.

## Parâmetros para uma geração futura

Verifique novamente o catálogo, o plano, o saldo e a estimativa antes de enviar. Esses valores podem mudar.

```json
{
  "model": "seedance_2_5",
  "mode": "omni_reference",
  "duration": 8,
  "aspect_ratio": "21:9",
  "resolution": "1080p",
  "generate_audio": false,
  "bitrate_mode": "high",
  "count": 1
}
```

Use `hero-estacionamento.png`, na raiz deste repositório, com o papel `start_image`. O arquivo é arte conceitual e não representa uma instalação escolar verificada. Envie o prompt abaixo integralmente, sem texto ou controles da página incorporados ao vídeo.

## Prompt integral fornecido pelo usuário

```text
Create a premium, scroll-scrubbed cinematic hero background for a school parking-management landing page, using the supplied image as the exact first frame and primary visual reference.

The source image is conceptual artwork. Preserve its existing parking structure, parked cars, road markings, violet-blue lighting and central translucent dashboard. Do not depict it as a verified real school or real facility.

Create one continuous 8-second shot in a wide cinematic composition. The clip will be scrubbed forward and backward by vertical page scroll, so make the motion coherent at every point in the timeline. The opening frame should closely match the supplied image. Finish on a clean, stable composition. No cuts, transitions, sudden actions or speed ramps.

0–1s: Hold almost still on the original composition, with only a subtle ambient light shift. Preserve dark negative space on the left for the headline and buttons.
1–3s: Begin a slow, precise camera push into the scene. Add restrained depth parallax between nearby parked cars, lane markings and the distant structure. Keep architectural lines straight and the original layout recognizable.
3–5.5s: Continue the same forward movement, following the existing illuminated lane toward the central dashboard. Let a soft glow travel along existing lane markings and gently define the dashboard’s existing translucent edges.
5.5–7s: Move slightly closer to the dashboard and reveal subtle depth between its existing layers. Keep the surrounding parking scene anchored and consistent.
7–8s: Ease to a stop and hold a polished end composition with the dashboard prominent and darker negative space on the left for the landing-page content.

High-end cinematic product-film look, deep graphite shadows, restrained violet and cool-blue light, realistic exposure and subtle atmospheric depth. Deliberate, elegant motion with premium polish; preserve detail when paused on any frame.

Keep every visible car parked in the same place. Do not add or remove people, vehicles, gates, barriers, cameras, sensors, signs, buildings, logos, readable text, numbers, license plates or interface panels. Do not redesign or morph the architecture, road, vehicles or dashboard. Avoid bending, melting, duplication, flicker, particles, sparks, light streaks, heavy lens flares, aggressive zoom, orbit and handheld shake. Keep website text and controls out of the generated footage; render them as real interface elements. No audio. Do not loop.
```

## Requisitos para uma futura retomada

1. Inspecione visualmente o começo, o meio e o fim do resultado. Confirme que a composição inicial corresponde à referência e que carros e estrutura não se deformam nem mudam de lugar.
2. Exporte um MP4 H.264, sem faixa de áudio, com metadados no começo do arquivo (`faststart`) e keyframes frequentes para reduzir o custo de busca temporal. Preserve uma cópia do original fora dos arquivos publicados, se necessário.
3. A integração de vídeo foi removida na atualização Pixel Perfect. Se ela voltar ao escopo, adicione novamente o elemento de vídeo, seu poster e um controlador de scroll que acompanhe a duração real da mídia, sem alterar os demais conteúdos da página. Não basta copiar um MP4 para a pasta estática.
4. Mantenha o poster estático, `muted`, `playsinline`, sem `autoplay` e sem `loop`. A rolagem deve controlar `currentTime`, usando a duração real carregada. Não reproduza o vídeo independentemente da rolagem.
5. Preserve o fallback para erro de mídia e `prefers-reduced-motion: reduce`; nesse modo, não solicite nem processe o vídeo. Suspenda o processamento fora da seção e quando a aba estiver oculta.
6. Verifique a busca para frente e para trás em desktop e celular. Títulos, números, formulários e painéis devem continuar como HTML real, independente da mídia.

Mantenha a imagem conceitual disponível como fallback dessa eventual integração. A extensão de rolagem e a fixação da seção só devem ser ativadas depois de carregar uma mídia válida e quando movimento reduzido não estiver ativo. A implementação atual dos cinco efeitos está documentada em [LANDING.md](LANDING.md).
