import concurrent.futures, datetime, email.utils, json, pathlib, urllib.request, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parent
FEEDS=[('BBC','세계','아시아','https://feeds.bbci.co.uk/news/world/asia/rss.xml'),('BBC','세계','유럽','https://feeds.bbci.co.uk/news/world/europe/rss.xml'),('BBC','세계','미주','https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml'),('BBC','세계','중동','https://feeds.bbci.co.uk/news/world/middle_east/rss.xml'),('BBC','세계','아프리카','https://feeds.bbci.co.uk/news/world/africa/rss.xml'),('BBC','경제','세계','https://feeds.bbci.co.uk/news/business/rss.xml'),('BBC','테크','세계','https://feeds.bbci.co.uk/news/technology/rss.xml'),('The Guardian','환경','세계','https://www.theguardian.com/environment/rss'),('The Guardian','문화','세계','https://www.theguardian.com/culture/rss')]
def collect(feed):
 source,category,region,url=feed
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'WorldHeadlines RSS Reader'}),timeout=25) as r: root=ET.fromstring(r.read(4000000))
  result=[]
  for item in root.findall('./channel/item')[:12]:
   title,link=item.findtext('title','').strip(),item.findtext('link','').strip()
   if not title or not link.startswith('https://'): continue
   try: published=email.utils.parsedate_to_datetime(item.findtext('pubDate')).isoformat()
   except (ValueError,TypeError): continue
   media=item.find('{http://search.yahoo.com/mrss/}thumbnail')
   if media is None: media=item.find('{http://search.yahoo.com/mrss/}content')
   result.append(dict(title=title,url=link,source=source,category=category,region=region,published=published,image=media.get('url','') if media is not None else ''))
  return result,None
 except Exception as error: return [],source+'/'+region+': '+type(error).__name__
def main():
 articles,errors={},[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  for items,error in pool.map(collect,FEEDS):
   if error: errors.append(error)
   for a in items: articles.setdefault(a['url'].split('?')[0],a)
 if not articles: raise SystemExit('All feeds failed; previous data preserved.')
 data=dict(updatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),articles=sorted(articles.values(),key=lambda a:a['published'],reverse=True),feedErrors=errors)
 ROOT.mkdir(exist_ok=True)
 (ROOT/'news.json').write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')
 print('Collected',len(articles),'headlines;',len(errors),'feed errors')
if __name__=='__main__': main()

