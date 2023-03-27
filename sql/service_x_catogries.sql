/****** Script for SelectTopNRows command from SSMS  ******/
SELECT TOP (100000) s.Code as ServiceCode
      ,c.Code as categoryCode
  FROM [hmis].[dbo].[ServiceItemsCats] as sg
  inner join ServiceItems as s
  on sg.ServiceItemID = s.id
  inner join ServiceCats as c
  on sg.ServiceCatID = c.id
  
  