import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ElementAModule } from 'element-a';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ElementAModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
