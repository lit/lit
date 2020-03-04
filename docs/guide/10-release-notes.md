---
title: Release Notes
slug: release-notes
layout: release-notes
---

<ul>
{%- for release in collections.release -%}
  <li><a href="{{ release.url }}">{{ release.data.title }}</a></li>
{%- endfor -%}
</ul>

<h3>Releases Prior to 1.2.0</h3>

We don't have written release notes for releases prior to 1.2.0. Please see the [changelog](https://github.com/Polymer/lit-html/blob/master/CHANGELOG.md) for those releases.


{%- for release in collections.release -%}
  <h1>{{ release.data.title }}</h1>
  {{ release.templateContent }}
{%- endfor -%}
