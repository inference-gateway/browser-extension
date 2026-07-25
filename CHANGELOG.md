# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0](https://github.com/inference-gateway/opentask/compare/v1.0.2...v1.1.0) (2026-07-25)

### ✨ Features

* add agents section to the extension backend ([#55](https://github.com/inference-gateway/opentask/issues/55)) ([6db0a74](https://github.com/inference-gateway/opentask/commit/6db0a746eb935cc37436c4884d7cdeae9e29a555))
* add Infer Agent workflow ([#49](https://github.com/inference-gateway/opentask/issues/49)) ([eac5eed](https://github.com/inference-gateway/opentask/commit/eac5eeda1e5268aad52257965a136ce1114b0c6a))
* add Infer Agent workflow ([#52](https://github.com/inference-gateway/opentask/issues/52)) ([a6ff533](https://github.com/inference-gateway/opentask/commit/a6ff533471a40da5ffd917bd4df202c6a8782426))
* track issues on their project board via installed workflow ([#48](https://github.com/inference-gateway/opentask/issues/48)) ([d3768ca](https://github.com/inference-gateway/opentask/commit/d3768cab6b7ef3653ab1b7f248f559f887b3a6c6)), closes [#42](https://github.com/inference-gateway/opentask/issues/42)

### 🐛 Bug Fixes

* disable plugins by default and correct plugin repos ([#50](https://github.com/inference-gateway/opentask/issues/50)) ([#51](https://github.com/inference-gateway/opentask/issues/51)) ([97655b7](https://github.com/inference-gateway/opentask/commit/97655b743a07e1fd507f34a046ce68245d42eba2))
* include enabled plugin skills in ! auto-complete menu ([#54](https://github.com/inference-gateway/opentask/issues/54)) ([4bf720f](https://github.com/inference-gateway/opentask/commit/4bf720fa105de79cf25e56f19be1902ac6d013de))
* namespace plugin skills as <plugin>:<skill> in autocomplete ([5291f15](https://github.com/inference-gateway/opentask/commit/5291f1543cda38e819afef33308e733717f4fa5a))

## [1.0.2](https://github.com/inference-gateway/opentask/compare/v1.0.1...v1.0.2) (2026-07-25)

### ♻️ Improvements

* rename extension from 'Inference Gateway for GitHub' to 'OpenTask for GitHub' ([#47](https://github.com/inference-gateway/opentask/issues/47)) ([42c2a4e](https://github.com/inference-gateway/opentask/commit/42c2a4e133f71000324fa343a8aad4742d5dd714))

## [1.0.1](https://github.com/inference-gateway/opentask/compare/v1.0.0...v1.0.1) (2026-07-25)

### 🐛 Bug Fixes

* **refine:** prevent multiple refine clicks, show permanent success state ([#45](https://github.com/inference-gateway/opentask/issues/45)) ([cc11d54](https://github.com/inference-gateway/opentask/commit/cc11d54882b556d3db6f4a6b057296fe7bd49ac2))

## 1.0.0 (2026-07-25)

### ✨ Features

* add infer-action plugins support to generated workflow ([#43](https://github.com/inference-gateway/opentask/issues/43)) ([4fba8fb](https://github.com/inference-gateway/opentask/commit/4fba8fb9897ba865a6e0c7c74cbce9bd10e2090f))

### 🔧 Miscellaneous

* first commit ([6b568b8](https://github.com/inference-gateway/opentask/commit/6b568b81c01782e62a80f62770228044ec2f2aef))

## [0.4.0](https://github.com/inference-gateway/opentask/compare/v0.3.0...v0.4.0) (2026-07-25)

### ✨ Features

* add Infer Agent workflow ([#35](https://github.com/inference-gateway/opentask/issues/35)) ([74ad7e5](https://github.com/inference-gateway/opentask/commit/74ad7e5af6c9a093cf42522c06b4d1dc69ab500f))
* add mergePrompts and new default prompt ([5b738f9](https://github.com/inference-gateway/opentask/commit/5b738f960bb1648b2dc0d09ab66a672049b9a43f))
* **edge:** publish to Microsoft Edge Add-ons ([#30](https://github.com/inference-gateway/opentask/issues/30)) ([25a7675](https://github.com/inference-gateway/opentask/commit/25a7675eea83ee3ad245e47a49d67d2ab7f6a6e1))
* **firefox:** add Firefox-compatible build with shared manifest overrides ([#32](https://github.com/inference-gateway/opentask/issues/32)) ([4ca737d](https://github.com/inference-gateway/opentask/commit/4ca737d6b071707427a2a260e1b69823351b3e6c))
* **safari:** add Safari Web Extension packaging and release docs ([#33](https://github.com/inference-gateway/opentask/issues/33)) ([9e6a80f](https://github.com/inference-gateway/opentask/commit/9e6a80f7e03d68f4817fbdd7aaad39d160c4c334))

### 🐛 Bug Fixes

* **workflow:** attribute generated-workflow commits to the App bot ([#34](https://github.com/inference-gateway/opentask/issues/34)) ([301ffd4](https://github.com/inference-gateway/opentask/commit/301ffd49a6ae29a26e135a3cae889fc263160df4))

### 👷 CI

* **tasks:** install task CLI in tasks.yml workflow ([#31](https://github.com/inference-gateway/opentask/issues/31)) ([970e628](https://github.com/inference-gateway/opentask/commit/970e628b22850a90636af5ab02ce0dc74c4fe094))

### 🔧 Miscellaneous

* update repository URL in .releaserc.yaml ([80ee5eb](https://github.com/inference-gateway/opentask/commit/80ee5eb86c4b46effb8ef2a2b9e113ee17b0db52))

## [0.3.0](https://github.com/inference-gateway/browser-extension/compare/v0.2.0...v0.3.0) (2026-07-24)

### ✨ Features

* add Infer Agent workflow ([#22](https://github.com/inference-gateway/browser-extension/issues/22)) ([cbff7ff](https://github.com/inference-gateway/browser-extension/commit/cbff7ff78109564ec8bb5d5a2e99cbc7cd70ddc1))
* add Infer Agent workflow ([#24](https://github.com/inference-gateway/browser-extension/issues/24)) ([759b677](https://github.com/inference-gateway/browser-extension/commit/759b677963c612dc96b25817d0dff1c5b584343e))
* add Infer Agent workflow ([#25](https://github.com/inference-gateway/browser-extension/issues/25)) ([baeb539](https://github.com/inference-gateway/browser-extension/commit/baeb5398667de26b3706e399b3b2d8e1d33e2fa4))
* add Infer Agent workflow ([#27](https://github.com/inference-gateway/browser-extension/issues/27)) ([3619140](https://github.com/inference-gateway/browser-extension/commit/3619140c45f518dd8249f05f2c72683bec13bc48))
* add permissions management for Infer Agent and update workflow generation ([5d23370](https://github.com/inference-gateway/browser-extension/commit/5d233703a13230ca10de0b20ada24d1287e1e478))
* add skills registry and task management ([f652da6](https://github.com/inference-gateway/browser-extension/commit/f652da68b829ca7eabc5c5de4282618a5c871ff6))
* **popup:** add toolbar popup with one-click Infer Agent install ([#19](https://github.com/inference-gateway/browser-extension/issues/19)) ([93b4634](https://github.com/inference-gateway/browser-extension/commit/93b46345d68f3dbc8f50b9493a4ee8467baa1cae))
* **edge:** publish to Microsoft Edge Add-ons ([#8](https://github.com/inference-gateway/browser-extension/issues/8))

### 🐛 Bug Fixes

* handle empty path in ghFetch URL ([1dd57d9](https://github.com/inference-gateway/browser-extension/commit/1dd57d9c830229e8ff7657fd17967e96b2ac3fbf))

### 🔧 Miscellaneous

* delete .github/workflows/infer.yml ([f97fe01](https://github.com/inference-gateway/browser-extension/commit/f97fe01657c83046d51d9c18795675def9d7da20))

## [0.2.0](https://github.com/inference-gateway/browser-extension/compare/v0.1.0...v0.2.0) (2026-07-24)

### ✨ Features

* add deterministic marketplace packaging and GitHub Release artifacts ([#15](https://github.com/inference-gateway/browser-extension/issues/15)) ([5500226](https://github.com/inference-gateway/browser-extension/commit/5500226aee216d41b100f47681104b06f296c1f1))
* add privacy docs and harden GitHub token management ([#14](https://github.com/inference-gateway/browser-extension/issues/14)) ([2e14581](https://github.com/inference-gateway/browser-extension/commit/2e145810d21592567733e4a7500f1a3830dc3ed5))
* prepare Chrome Web Store listing assets ([#16](https://github.com/inference-gateway/browser-extension/issues/16)) ([290797e](https://github.com/inference-gateway/browser-extension/commit/290797ecdbe7b791e14ff29e8160700ca736a7c5))

### 📚 Documentation

* update package description ([96b650b](https://github.com/inference-gateway/browser-extension/commit/96b650b295a528a6f3227f4c14dc5ba0304d9e7a))
