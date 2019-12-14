import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { fromEvent, timer, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('canvas', { static: true }) kanvas: ElementRef;

  kontekstKanvasa: CanvasRenderingContext2D;
  sabskripcija: Subscription;

  nanoboti: Nanobot[] = []
  brojNanobota: number = 100;
  brzina: number = 5000;

  tkivoX: number = 1200;
  tkivoY: number = 800;

  gBest: number = 0;
  gBestX: number = this.tkivoX;
  gBestY: number = this.tkivoY;


  ngAfterViewInit(): void {
    this.kanvas.nativeElement.width = window.innerWidth;
    this.kanvas.nativeElement.height = window.innerHeight;
    this.kontekstKanvasa = (<HTMLCanvasElement>this.kanvas.nativeElement).getContext('2d');

    for (let i = 0; i < this.brojNanobota; i++)
      this.nanoboti.push(new Nanobot(this.kontekstKanvasa));
    this.nacrtaj();

    fromEvent(this.kanvas.nativeElement, 'click').subscribe((event: MouseEvent) => {
      this.tkivoX = event.x;
      this.tkivoY = event.y;
      this.nacrtaj();
      this.inicijalizujNanobote(false);
    });

    this.inicijalizujNanobote(true);
  }

  inicijalizujNanobote(nasumicno: boolean): void {
    if (nasumicno) {
      this.nanoboti.forEach((nanobot, indeks) => {
        const x: number = Math.floor(Math.random() * 300) + 10;
        const y: number = Math.floor(Math.random() * 500) + 10;
        nanobot.inicijalizuj(indeks, x, y);
        nanobot.izracunajDobrotu(this.tkivoX, this.tkivoY);
        nanobot.pBest = nanobot.dobrota;
      });
    }
    else {
      this.nanoboti.forEach((nanobot, indeks) => {
        nanobot.inicijalizuj(indeks, nanobot.x, nanobot.y);
        nanobot.izracunajDobrotu(this.tkivoX, this.tkivoY);
        nanobot.pBest = nanobot.dobrota;
      });
    }
    this.start();
  }

  traziTkivo(): void {
    this.nanoboti[0].izracunajDobrotu(this.tkivoX, this.tkivoY);
    let najboljaDobrota: number = this.nanoboti[0].dobrota;
    let indeksNajboljeDobrote: number = 0;

    this.nanoboti.forEach(nanobot => {
      nanobot.izracunajDobrotu(this.tkivoX, this.tkivoY);
      if (nanobot.dobrota < najboljaDobrota) {
        najboljaDobrota = nanobot.dobrota;
        indeksNajboljeDobrote = nanobot.indeks;
      }
      if (nanobot.dobrota < nanobot.pBest) {
        nanobot.pBest = nanobot.dobrota;
        nanobot.pBestX = nanobot.x;
        nanobot.pBestY = nanobot.y;
      }

    });
    this.gBest = najboljaDobrota;
    this.gBestX = this.nanoboti[indeksNajboljeDobrote].x;
    this.gBestY = this.nanoboti[indeksNajboljeDobrote].y;

    this.nanoboti.forEach(nanobot => {
      const rand = Math.random();

      if (this.gBest == nanobot.dobrota) {
        nanobot.x = (1 - rand) * nanobot.x + rand * this.tkivoX;
        nanobot.y = (1 - rand) * nanobot.y + rand * this.tkivoY;
      }

      const smerKretanjaX = nanobot.smerKretanjaX + 2 * rand * (nanobot.pBestX - nanobot.x) + 2 * rand * (this.gBestX - nanobot.x);
      const smerKretanjaY = nanobot.smerKretanjaY + 2 * rand * (nanobot.pBestY - nanobot.y) + 2 * rand * (this.gBestY - nanobot.y);

      if (smerKretanjaX > 0 && smerKretanjaX < window.innerWidth && smerKretanjaY > 0 && smerKretanjaY < window.innerHeight) {
        nanobot.smerKretanjaX = smerKretanjaX;
        nanobot.smerKretanjaY = smerKretanjaY;
        nanobot.x = nanobot.smerKretanjaX;
        nanobot.y = nanobot.smerKretanjaY;
        this.nacrtaj();
      }
    });
  }

  nacrtaj(): void {
    this.kontekstKanvasa.clearRect(0, 0, this.kanvas.nativeElement.width, this.kanvas.nativeElement.height);
    this.kontekstKanvasa.fillStyle = 'lightpink';
    this.kontekstKanvasa.fillRect(0, 0, this.kanvas.nativeElement.width, this.kanvas.nativeElement.height);

    this.kontekstKanvasa.fillStyle = 'purple';
    this.kontekstKanvasa.fillRect(this.tkivoX - 10, this.tkivoY - 10, 20, 20);
    this.nanoboti.forEach(x => x.nacrtaj());
  }

  start(): void {
    if (this.sabskripcija != undefined)
      this.sabskripcija.unsubscribe();
    this.sabskripcija = timer(0, this.brzina).subscribe(() => {
      this.traziTkivo();
    });
  }

  sacuvajKanvas(imeFajla) {
    var format = "image/png";
    var url = this.kanvas.nativeElement.toDataURL(format);
    var link = document.createElement('a');

    link.download = imeFajla;
    link.href = url;
    link.dataset.downloadurl = [format, link.download, link.href].join(':');

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

class Nanobot {
  indeks: number = 0;
  dobrota: number = 0;
  x: number = 0;
  y: number = 0;

  pBest: number = 0;
  pBestX: number = 0;
  pBestY: number = 0;

  smerKretanjaX: number = 0;
  smerKretanjaY: number = 0;

  constructor(private kontekstKanvasa: CanvasRenderingContext2D) { }

  inicijalizuj(indeks: number, x: number, y: number): void {
    this.indeks = indeks;
    this.x = x;
    this.y = y;
    this.pBestX = this.x;
    this.pBestY = this.y;
    this.smerKretanjaX = this.x;
    this.smerKretanjaY = this.y;
  }

  izracunajDobrotu(tkivoX: number, tkivoY: number): void {
    this.dobrota = Math.sqrt((tkivoX - this.x) * (tkivoX - this.x) + (tkivoY - this.y) * (tkivoY - this.y));
  }

  nacrtaj(): void {
    this.kontekstKanvasa.lineWidth = 2;
    this.kontekstKanvasa.lineCap = 'round';
    this.kontekstKanvasa.strokeStyle = 'grey';
    this.kontekstKanvasa.fillStyle = 'grey';
    this.kontekstKanvasa.fillRect(this.x - 5, this.y - 5, 10, 10);

    this.kontekstKanvasa.beginPath();
    this.kontekstKanvasa.moveTo(this.x, this.y);
    this.kontekstKanvasa.lineTo(this.x - 10, this.y + 10);
    this.kontekstKanvasa.lineTo(this.x - 10, this.y + 15);
    this.kontekstKanvasa.stroke();

    this.kontekstKanvasa.beginPath();
    this.kontekstKanvasa.moveTo(this.x, this.y);
    this.kontekstKanvasa.lineTo(this.x + 10, this.y + 10);
    this.kontekstKanvasa.lineTo(this.x + 10, this.y + 15);
    this.kontekstKanvasa.stroke();

    this.kontekstKanvasa.beginPath();
    this.kontekstKanvasa.moveTo(this.x, this.y);
    this.kontekstKanvasa.lineTo(this.x - 10, this.y - 10);
    this.kontekstKanvasa.lineTo(this.x - 10, this.y - 15);
    this.kontekstKanvasa.stroke();

    this.kontekstKanvasa.beginPath();
    this.kontekstKanvasa.moveTo(this.x, this.y);
    this.kontekstKanvasa.lineTo(this.x + 10, this.y - 10);
    this.kontekstKanvasa.lineTo(this.x + 10, this.y - 15);
    this.kontekstKanvasa.stroke();
  }
}
